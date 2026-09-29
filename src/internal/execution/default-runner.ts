/**
 * `DefaultCommandRunner` (`ARCHITECTURE.md`, "Item 2" + "Item 3"):
 * implements the existing, unchanged `CommandRunner` interface
 * (`internal/command-runner.ts`, Task 2) by composing framing (C2) +
 * limits (C3) + a `SessionQueue` (C5) + a `Transport` (C4). Both the public
 * raw wrapper (`Vigor3912SClient#execute`) and typed operations
 * (`runOperation`) use this one seam.
 *
 * No logging: error messages below carry only identity metadata (byte
 * counts, elapsed ms via limit values) -- never the command string body,
 * stdout, or stderr (`tests/execution/no-output-leak.test.ts` proves this).
 */

import type { CommandResult, ExecuteOptions } from "../../client.js";
import { Vigor3912SError, sdkErrorCodes } from "../../errors.js";
import type { CommandRunner } from "../command-runner.js";
import { type CommandFrame, frameSingleCommand } from "./framing.js";
import {
  type ExecutionLimits,
  assertExecutionLimits,
  defaultExecutionLimits,
  resolveLimits,
} from "./limits.js";
import { SessionQueue, toAbortError } from "./session-queue.js";
import type { Transport, TransportExchange } from "./transport.js";

function timeoutError(commandTimeoutMs: number): Vigor3912SError {
  return new Vigor3912SError(
    sdkErrorCodes.executionTimeout,
    `Command exceeded the commandTimeoutMs limit (${String(commandTimeoutMs)}ms).`,
  );
}

function idleTimeoutError(idleTimeoutMs: number): Vigor3912SError {
  return new Vigor3912SError(
    sdkErrorCodes.executionTimeout,
    `Command produced no output for the idleTimeoutMs limit (${String(idleTimeoutMs)}ms).`,
  );
}

interface Deadline {
  readonly error: Vigor3912SError;
  /** Rejects with `error` when the deadline passes; never settles otherwise. */
  readonly expired: Promise<never>;
  clear(): void;
}

/**
 * A hard deadline independent of transport cooperation: `expired` rejects on
 * time even if the transport ignores its `AbortSignal`.
 */
function createDeadline(ms: number, error: Vigor3912SError, onExpire: () => void): Deadline {
  let handle: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_resolve, reject) => {
    handle = setTimeout(() => {
      onExpire();
      reject(error);
    }, ms);
  });

  // Losing a race is not an error; keep the rejection from surfacing as unhandled.
  expired.catch(() => undefined);

  return {
    error,
    expired,
    clear: () => {
      clearTimeout(handle);
    },
  };
}

/**
 * Rejects when the caller aborts, so an in-flight command settles on abort
 * even if the transport ignores its `AbortSignal`.
 */
function whenAborted(signal: AbortSignal): Promise<never> {
  const aborted = new Promise<never>((_resolve, reject) => {
    if (signal.aborted) {
      reject(toAbortError(signal.reason));
      return;
    }

    signal.addEventListener(
      "abort",
      () => {
        reject(toAbortError(signal.reason));
      },
      { once: true },
    );
  });

  aborted.catch(() => undefined);
  return aborted;
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

function outputBytes(exchange: TransportExchange): number {
  return Buffer.byteLength(exchange.stdout, "utf8") + Buffer.byteLength(exchange.stderr, "utf8");
}

function isTimeout(error: unknown): error is Vigor3912SError {
  return error instanceof Vigor3912SError && error.code === sdkErrorCodes.executionTimeout;
}

export class DefaultCommandRunner implements CommandRunner {
  readonly #transport: Transport;
  readonly #baseLimits: ExecutionLimits;
  readonly #queue: SessionQueue;

  public constructor(transport: Transport, baseLimits: ExecutionLimits = defaultExecutionLimits) {
    assertExecutionLimits(baseLimits);
    this.#transport = transport;
    this.#baseLimits = baseLimits;
    this.#queue = new SessionQueue();
  }

  /** The `CommandRunner` seam used by the raw wrapper. */
  public run(command: string, options?: ExecuteOptions): Promise<CommandResult> {
    return this.#dispatch(command, options, {});
  }

  /**
   * Runs one command under a typed operation's registry-defined
   * `executionOverride` (`ARCH#Item-3`: `ip ping` / `ip tracert` may run far
   * longer than the 15s default). Only the registry raises a ceiling; a
   * caller's `ExecuteOptions.timeoutMs` can still only lower it.
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
    const limits = resolveLimits(this.#baseLimits, options, override);

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

    const deadline = createDeadline(
      limits.commandTimeoutMs,
      timeoutError(limits.commandTimeoutMs),
      () => {
        controller.abort(timeoutError(limits.commandTimeoutMs));
      },
    );
    const stops = [deadline.expired, whenAborted(sessionSignal)] as const;

    try {
      const exchange =
        this.#transport.stream !== undefined
          ? await this.#collectStream(frame, limits, controller, stops)
          : await Promise.race([this.#transport.send(frame, limits, controller.signal), ...stops]);

      if (outputBytes(exchange) > limits.maxOutputBytes) {
        this.#failOnOutputLimit(controller, limits);
      }

      return {
        command: frame.command,
        stdout: exchange.stdout,
        stderr: exchange.stderr,
      };
    } catch (error) {
      // A cooperative transport rejects with its own error once aborted by a
      // deadline; report the timeout, not that secondary error.
      const reason: unknown = controller.signal.reason;
      const timeout = isTimeout(error) ? error : isTimeout(reason) ? reason : undefined;

      if (timeout !== undefined) {
        this.#invalidateSession("execution_timeout");
        throw timeout;
      }

      // Aborted mid-exchange: the router may still answer the abandoned
      // command, so the session is no longer in sync.
      if (sessionSignal.aborted) {
        this.#invalidateSession("aborted");
        throw toAbortError(sessionSignal.reason);
      }

      throw error;
    } finally {
      deadline.clear();
      sessionSignal.removeEventListener("abort", forwardAbort);
    }
  }

  /**
   * Reads a streaming transport chunk by chunk, enforcing the overall
   * deadline, the idle timeout and the output ceiling while output arrives.
   */
  async #collectStream(
    frame: CommandFrame,
    limits: ExecutionLimits,
    controller: AbortController,
    stops: readonly Promise<never>[],
  ): Promise<TransportExchange> {
    const chunks = this.#transport.stream?.(frame, limits, controller.signal);

    if (chunks === undefined) {
      throw new Error("Transport.stream disappeared during dispatch.");
    }

    const iterator = chunks[Symbol.asyncIterator]();
    let stdout = "";
    let stderr = "";
    let bytes = 0;
    let finished = false;

    try {
      for (;;) {
        const idle = createDeadline(
          limits.idleTimeoutMs,
          idleTimeoutError(limits.idleTimeoutMs),
          () => {
            controller.abort(idleTimeoutError(limits.idleTimeoutMs));
          },
        );
        let step: IteratorResult<{ readonly stream: "stdout" | "stderr"; readonly data: string }>;

        try {
          step = await Promise.race([iterator.next(), ...stops, idle.expired]);
        } finally {
          idle.clear();
        }

        if (step.done === true) {
          finished = true;
          return { stdout, stderr };
        }

        bytes += Buffer.byteLength(step.value.data, "utf8");

        if (bytes > limits.maxOutputBytes) {
          this.#failOnOutputLimit(controller, limits);
        }

        if (step.value.stream === "stdout") {
          stdout += step.value.data;
        } else {
          stderr += step.value.data;
        }
      }
    } finally {
      if (!finished) {
        // Stop a producer that may still be running; never wait on it.
        void Promise.resolve(iterator.return?.()).catch(() => undefined);
      }
    }
  }

  /**
   * Oversized output closes this runner for good (no truncation, `ARCH#Item-3`).
   * The transport close is not awaited: a transport that floods output may
   * also hang on close, and the caller must still get the error on time.
   */
  #failOnOutputLimit(controller: AbortController, limits: ExecutionLimits): never {
    const error = outputLimitError(limits.maxOutputBytes);

    controller.abort(error);
    this.#queue.close("output_limit_exceeded");
    this.#invalidateSession("output_limit_exceeded");
    throw error;
  }

  /**
   * After a timeout the router may still emit the abandoned command's output,
   * which would corrupt the next exchange. Close the transport session so the
   * transport reconnects (or reports closed) before the next command. Never
   * awaited: a transport that hung once may hang on close too.
   */
  #invalidateSession(reason: string): void {
    void Promise.resolve()
      .then(() => this.#transport.close(reason))
      .catch(() => undefined);
  }
}
