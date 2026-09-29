import type { CommandRunner } from "./internal/command-runner.js";
import { DefaultCommandRunner } from "./internal/execution/default-runner.js";
import { defaultExecutionLimits, type ExecutionLimits } from "./internal/execution/limits.js";
import { runOperation } from "./internal/execution/run-operation.js";
import type { Transport } from "./internal/execution/transport.js";
import type { TypedOperation } from "./internal/registry/operation.js";
import { operationRegistry } from "./internal/registry/registry.generated.js";
import { OperationNotImplementedError, Vigor3912SError, sdkErrorCodes } from "./errors.js";

export interface ExecuteOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

export interface CommandResult {
  readonly command: string;
  readonly stdout: string;
  readonly stderr: string;
}

export interface FromTransportOptions {
  /** Partial override of default execution limits for the composed runner. */
  readonly limits?: Partial<ExecutionLimits>;
}

/**
 * `Vigor3912SClient` dispatches raw `execute()` and typed `invoke()` over an
 * injected `CommandRunner`. Classification is metadata only — the consumer
 * (app / MCP / `LiveReadOnlyClient`) owns authorization policy.
 */
export class Vigor3912SClient {
  readonly #runner: CommandRunner | undefined;

  public constructor(runner?: CommandRunner) {
    this.#runner = runner;
  }

  public static fromTransport(
    transport: Transport,
    options: FromTransportOptions = {},
  ): Vigor3912SClient {
    const limits: ExecutionLimits = {
      ...defaultExecutionLimits,
      ...options.limits,
    };
    return new Vigor3912SClient(new DefaultCommandRunner(transport, limits));
  }

  /**
   * Raw, unguarded dispatch: sends any framed command — including write and
   * destructive ones — with no classification or authorization check, and
   * returns router output unjudged (see `detectCliRejection`). Not a safety
   * boundary; expose only behind the consumer's own authorization.
   */
  public execute(command: string, options?: ExecuteOptions): Promise<CommandResult> {
    if (this.#runner !== undefined) {
      return this.#runner.run(command, options);
    }

    const commandState = command.trim().length === 0 ? "empty command" : "command";
    const optionState = options === undefined ? "without options" : "with options";

    return Promise.reject(
      new OperationNotImplementedError(
        `Raw command execution is not implemented (${commandState}, ${optionState}, without runner).`,
      ),
    );
  }

  public async invoke<TInput, TOutput>(
    operation: TypedOperation<TInput, TOutput>,
    input: TInput,
    options?: ExecuteOptions,
  ): Promise<TOutput> {
    if (this.#runner === undefined) {
      return Promise.reject(
        new OperationNotImplementedError("Typed invoke is not implemented (without runner)."),
      );
    }

    const canonical = operationRegistry.get(operation.manifestId);
    if (canonical !== operation) {
      throw new Vigor3912SError(
        sdkErrorCodes.forgedOperationRejected,
        `Typed operation "${operation.manifestId}" is not the canonical registry descriptor.`,
      );
    }

    return runOperation(this.#runner, operation, input, options);
  }
}
