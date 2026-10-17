import { pathToFileURL } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { runBooleanCliIfMain, runIfMain } from "../../tools/cli-entry.ts";

describe("CLI entry dispatch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips absent or different entry points and awaits the matching callback", async () => {
    const run = vi.fn(() => Promise.resolve("ran"));
    const entryPoint = pathToFileURL("/tmp/example-cli.ts").href;

    await expect(runIfMain(undefined, entryPoint, run)).resolves.toBeUndefined();
    await expect(runIfMain("/tmp/other-cli.ts", entryPoint, run)).resolves.toBeUndefined();
    await expect(runIfMain("/tmp/example-cli.ts", entryPoint, run)).resolves.toBe("ran");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("sets a failing exit code only when an invoked boolean CLI reports failure", async () => {
    const originalExitCode = process.exitCode;
    const entryPoint = pathToFileURL("/tmp/example-cli.ts").href;

    await runBooleanCliIfMain("/tmp/example-cli.ts", entryPoint, () => Promise.resolve(true));
    expect(process.exitCode).toBe(originalExitCode);

    await runBooleanCliIfMain("/tmp/example-cli.ts", entryPoint, () => Promise.resolve(false));
    expect(process.exitCode).toBe(1);
    process.exitCode = originalExitCode;

    await runBooleanCliIfMain(undefined, entryPoint, () => Promise.resolve(false));
    expect(process.exitCode).toBe(originalExitCode);
  });
});
