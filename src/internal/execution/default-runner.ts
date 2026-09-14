/**
 * `DefaultCommandRunner` (`ARCHITECTURE.md`, "Item 2" + "Item 3"):
 * implements the existing, unchanged `CommandRunner` interface
 * (`internal/command-runner.ts`, Task 2) by composing framing (C2) +
 * limits (C3) + a `SessionQueue` (C5) + a `Transport` (C4). Both the public
 * raw wrapper (`Vigor3912SClient#execute`) and, later, typed operations use
 * this one seam.
 *
 * No logging: error messages below carry only identity metadata (byte
 * counts, elapsed ms via limit values) -- never the command string body,
 * stdout, or stderr (`tests/execution/no-output-leak.test.ts` proves this).
 */

import type { CommandResult, ExecuteOptions } from "../../client.js";
import { Vigor3912SError, sdkErrorCodes } from "../../errors.js";
import type { CommandRunner } from "../command-runner.js";
import { type CommandFrame, frameSingleCommand } from "./framing.js";
import { type ExecutionLimits, defaultExecutionLimits, resolveLimits } from "./limits.js";
import { SessionQueue } from "./session-queue.js";
import type { Transport } from "./transport.js";

function timeoutError(commandTimeoutMs: number): Vigor3912SError {
  return new Vigor3912SError(
    sdkErrorCodes.executionTimeout,
    `Command exceeded the commandTimeoutMs limit (${String(commandTimeoutMs)}ms).`,
  );
}

function outputLimitError(maxOutputBytes: number): Vigor3912SError {
  return new Vigor3912SError(
    sdkErrorCodes.outputLimitExceeded,
    `Command output exceeded the maxOutputBytes limit (${String(maxOutputBytes)} bytes); the session was closed rather than truncating output.`,
  );
}

function commandTooLargeError(maxCommandBytes: number): Vigor3912SError {
  return new Vigor3912SError(
    sdkErrorCodes.commandFramingRejected,
    `Command exceeds the maxCommandBytes limit (${String(maxCommandBytes)} bytes).`,
  );
}

export class DefaultCommandRunner implements CommandRunner {
  readonly #transport: Transport;
  readonly #baseLimits: ExecutionLimits;
  readonly #queue: SessionQueue;

  public constructor(transport: Transport, baseLimits: ExecutionLimits = defaultExecutionLimits) {
    this.#transport = transport;
    this.#baseLimits = baseLimits;
    this.#queue = new SessionQueue();
  }

  /** The `CommandRunner` seam used by the raw wrapper. */
  public run(command: string, options?: ExecuteOptions): Promise<CommandResult> {
    return this.#dispatch(command, options, {});
  }

  /**
   * Diagnostic-exception seam, deliberately **not** part of the public
   * `CommandRunner` interface. Per `ARCH#Item-3`, `ip ping`/`ip tracert` may
   * run far longer than the 15s default; that ceiling is raised only via a
   * registry-defined `executionOverride` on the typed operation itself
   * (Item 5, out of this task's scope to wire), never via a caller-supplied
   * `ExecuteOptions.timeoutMs` on the raw wrapper. This method exists so
   * that future registry/typed-operation code has a concrete, tested seam to
   * call into, without widening `run()`'s contract.
   */
  public runWithOverride(
    command: string,
    override: Partial<ExecutionLimits>,
    options?: ExecuteOptions,
  ): Promise<CommandResult> {
    return this.#dispatch(command, options, override);
  }

  /** Closes both the transport and the session queue. */
  public async close(reason: string): Promise<void> {
    this.#queue.close(reason);
    await this.#transport.close(reason);
  }

  async #dispatch(
    command: string,
    options: ExecuteOptions | undefined,
    override: Partial<ExecutionLimits>,
  ): Promise<CommandResult> {
    const frame = frameSingleCommand(command);
    const resolved = resolveLimits(this.#baseLimits, options);
    const merged: ExecutionLimits = {
      ...resolved,
      ...override,
    };
    // Caller timeoutMs may only lower the effective command timeout, even when
    // a typed-operation override raises the default ceiling.
    const limits: ExecutionLimits = {
      ...merged,
      commandTimeoutMs:
        options?.timeoutMs !== undefined
          ? Math.min(merged.commandTimeoutMs, options.timeoutMs)
          : merged.commandTimeoutMs,
    };

    if (Buffer.byteLength(frame.command, "utf8") > limits.maxCommandBytes) {
      throw commandTooLargeError(limits.maxCommandBytes);
    }

    return this.#queue.enqueue(
      (signal) => this.#executeFramed(frame, limits, signal),
      options?.signal,
    );
  }

  async #executeFramed(
    frame: CommandFrame,
    limits: ExecutionLimits,
    sessionSignal: AbortSignal,
  ): Promise<CommandResult> {
    if (!this.#transport.isOpen) {
      throw new Vigor3912SError(sdkErrorCodes.sessionClosed, "Transport is not open.");
    }

    const controller = new AbortController();
    const forwardAbort = (): void => {
      controller.abort(sessionSignal.reason);
    };
    sessionSignal.addEventListener("abort", forwardAbort, { once: true });

    const timedOutError = timeoutError(limits.commandTimeoutMs);
    const timeoutHandle = setTimeout(() => {
      controller.abort(timedOutError);
    }, limits.commandTimeoutMs);

    try {
      const exchange = await this.#transport.send(frame, limits, controller.signal);

      const outputBytes =
        Buffer.byteLength(exchange.stdout, "utf8") + Buffer.byteLength(exchange.stderr, "utf8");

      if (outputBytes > limits.maxOutputBytes) {
        const error = outputLimitError(limits.maxOutputBytes);
        await this.close("output_limit_exceeded");
        throw error;
      }

      return {
        command: frame.command,
        stdout: exchange.stdout,
        stderr: exchange.stderr,
      };
    } catch (error) {
      if (controller.signal.reason === timedOutError) {
        throw timedOutError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
      sessionSignal.removeEventListener("abort", forwardAbort);
    }
  }
}
