import type { CommandResult, ExecuteOptions } from "../client.js";

export interface CommandRunner {
  run(command: string, options?: ExecuteOptions): Promise<CommandResult>;
}
