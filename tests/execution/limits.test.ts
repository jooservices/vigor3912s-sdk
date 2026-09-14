import { describe, expect, it } from "vitest";

import { defaultExecutionLimits, resolveLimits } from "../../src/internal/execution/limits.js";

describe("defaultExecutionLimits", () => {
  it("matches the root/user approved final numbers", () => {
    expect(defaultExecutionLimits).toEqual({
      maxCommandBytes: 1024,
      commandTimeoutMs: 15_000,
      idleTimeoutMs: 5_000,
      maxOutputBytes: 4 * 1024 * 1024,
    });
  });
});

describe("resolveLimits", () => {
  it("returns the defaults unchanged when no options are given", () => {
    expect(resolveLimits(defaultExecutionLimits)).toEqual(defaultExecutionLimits);
  });

  it("lowers commandTimeoutMs when the caller asks for a smaller timeout", () => {
    const resolved = resolveLimits(defaultExecutionLimits, { timeoutMs: 1000 });

    expect(resolved.commandTimeoutMs).toBe(1000);
    expect(resolved.maxCommandBytes).toBe(defaultExecutionLimits.maxCommandBytes);
    expect(resolved.maxOutputBytes).toBe(defaultExecutionLimits.maxOutputBytes);
  });

  it("never raises commandTimeoutMs above the default, even if the caller asks for more", () => {
    const resolved = resolveLimits(defaultExecutionLimits, { timeoutMs: 999_999 });

    expect(resolved.commandTimeoutMs).toBe(defaultExecutionLimits.commandTimeoutMs);
  });
});
