import { describe, expect, it, vi } from "vitest";

import type { CommandRunner } from "../../src/internal/command-runner.js";
import { frameSingleCommand } from "../../src/internal/execution/framing.js";
import { runOperation } from "../../src/internal/execution/run-operation.js";
import type { TypedOperation } from "../../src/internal/registry/operation.js";

const operation: TypedOperation<void, string> = {
  manifestId: "cli.sys.version", // an input-less id: no schema check applies
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip ping 192.168.1.1")],
  parse: (exchanges) => exchanges.map((exchange) => exchange.stdout).join(""),
  executionOverride: { commandTimeoutMs: 60_000 },
};

function result(stdout: string) {
  return Promise.resolve({ command: "ip ping 192.168.1.1", stdout, stderr: "" });
}

describe("runOperation", () => {
  it("passes the executionOverride to a runner that supports it", async () => {
    const runWithOverride = vi.fn(() => result("ok"));
    const runner: CommandRunner = { run: vi.fn(() => result("unused")), runWithOverride };

    await expect(runOperation(runner, operation, undefined)).resolves.toBe("ok");
    expect(runWithOverride).toHaveBeenCalledWith(
      "ip ping 192.168.1.1",
      { commandTimeoutMs: 60_000 },
      undefined,
    );
  });

  it("falls back to run() for a runner without runWithOverride", async () => {
    const run = vi.fn(() => result("ok"));

    await expect(runOperation({ run }, operation, undefined)).resolves.toBe("ok");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("refuses a rejected command without echoing router output", async () => {
    const run = vi.fn(() => result("% Invalid IP secret-host"));

    await expect(runOperation({ run }, operation, undefined)).rejects.toMatchObject({
      code: "command_rejected",
      message: expect.not.stringContaining("secret-host") as string,
    });
  });

  it("rejects input that selects no documented form (builder fell through)", async () => {
    const run = vi.fn(() => result("unused"));
    const fallsThrough = {
      ...operation,
      buildFrames: () => undefined as unknown as ReturnType<typeof operation.buildFrames>,
    };

    await expect(runOperation({ run }, fallsThrough, undefined)).rejects.toMatchObject({
      code: "invalid_input",
    });
    expect(run).not.toHaveBeenCalled();
  });
});
