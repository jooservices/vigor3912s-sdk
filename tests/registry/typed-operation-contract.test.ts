import { describe, expect, it } from "vitest";

import { frameSingleCommand } from "../../src/internal/execution/framing.js";
import type { ExecutionLimits } from "../../src/internal/execution/limits.js";
import type { CommandExchange } from "../../src/internal/execution/transport.js";
import type { TypedOperation } from "../../src/internal/registry/operation.js";

describe("TypedOperation contract", () => {
  it("uses concrete execution frame, exchange, and limit types", () => {
    const operation: TypedOperation<void, string> = {
      manifestId: "cli.sys.version",
      classification: "read",
      buildFrames: () => [frameSingleCommand("sys version")],
      parse: (exchanges: readonly CommandExchange[]) => exchanges[0]?.stdout ?? "",
      executionOverride: {
        commandTimeoutMs: 1_000,
      } satisfies Partial<ExecutionLimits>,
    };

    const frames = operation.buildFrames();
    const exchanges: CommandExchange[] = [{ stdout: "4.4.7_RC2", stderr: "" }];

    expect(frames).toHaveLength(1);
    expect(frames[0]?.command).toBe("sys version");
    expect(operation.parse(exchanges)).toBe("4.4.7_RC2");
    expect(operation.executionOverride).toEqual({ commandTimeoutMs: 1_000 });
  });
});
