import type { CommandResult, ExecuteOptions } from "../client.js";
import type { ExecutionLimits } from "./execution/limits.js";

export interface CommandRunner {
  run(command: string, options?: ExecuteOptions): Promise<CommandResult>;

  /**
   * Runs one command under a typed operation's registry-defined
   * `executionOverride` (e.g. the `ip ping` / `ip tracert` diagnostic
   * ceiling). Optional: a runner without it applies its own limits to every
   * command, so long-running diagnostics may time out under it.
   */
  runWithOverride?(
    command: string,
    override: Partial<ExecutionLimits>,
    options?: ExecuteOptions,
  ): Promise<CommandResult>;
}
