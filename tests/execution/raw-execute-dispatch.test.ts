import { describe, expect, it } from "vitest";

import { OperationNotImplementedError, Vigor3912SClient, sdkErrorCodes } from "../../src/index.js";
import { DefaultCommandRunner } from "../../src/internal/execution/default-runner.js";
import { defaultExecutionLimits } from "../../src/internal/execution/limits.js";
import { FakeTransport, exchange } from "../support/fake-transport.js";

/**
 * Wave 1 Lane C, task C6 -- reconciliation with Wave 2 task D.
 *
 * `RawTransport` (Wave 2's temporary local placeholder in `src/client.ts`)
 * has been removed. `Vigor3912SClient` now accepts the existing, unchanged
 * `CommandRunner` seam (`internal/command-runner.ts`, Task 2); the real
 * dispatch path is `DefaultCommandRunner`, composed here with the shared
 * `FakeTransport` (C4). This file now proves the *real* framing/limits/queue
 * behavior that the old placeholder file explicitly said was out of its
 * scope -- that scope has now landed.
 */
describe("raw execute() dispatch via Vigor3912SClient + DefaultCommandRunner + FakeTransport", () => {
  it("defaults to OperationNotImplementedError with no runner injected (unchanged from Task 2)", async () => {
    const client = new Vigor3912SClient();

    await expect(client.execute("sys version")).rejects.toMatchObject({
      name: "OperationNotImplementedError",
      code: sdkErrorCodes.operationNotImplemented,
    });
    await expect(client.execute("sys version")).rejects.toBeInstanceOf(
      OperationNotImplementedError,
    );
  });

  it("dispatches a well-formed command through the fully composed runner", async () => {
    const transport = new FakeTransport({ responses: [exchange("ok", "")] });
    const client = new Vigor3912SClient(new DefaultCommandRunner(transport));

    const result = await client.execute("show status");

    expect(result).toEqual({ command: "show status", stdout: "ok", stderr: "" });
  });

  it("now rejects a command framing.ts would reject, instead of passing it through untouched", async () => {
    const transport = new FakeTransport();
    const client = new Vigor3912SClient(new DefaultCommandRunner(transport));

    await expect(client.execute("show status; show session")).rejects.toMatchObject({
      code: sdkErrorCodes.commandFramingRejected,
    });
    expect(transport.calls).toEqual([]);
  });

  it("still allows the documented '?' recon carve-out through the real framing layer", async () => {
    const transport = new FakeTransport({ responses: [exchange("recon output")] });
    const client = new Vigor3912SClient(new DefaultCommandRunner(transport));

    const result = await client.execute("show ?");

    expect(result.stdout).toBe("recon output");
  });

  it("clamps ExecuteOptions.timeoutMs down but never raises it above the 15s default", async () => {
    const transport = new FakeTransport({ responses: [exchange("ok")] });
    const client = new Vigor3912SClient(new DefaultCommandRunner(transport));

    await client.execute("show status", { timeoutMs: 999_999 });

    expect(transport.calls[0]?.limits.commandTimeoutMs).toBe(
      defaultExecutionLimits.commandTimeoutMs,
    );
  });

  it("CommandResult has no exitCode field at runtime (ARCH#RDL B1)", async () => {
    const transport = new FakeTransport({ responses: [exchange("", "")] });
    const client = new Vigor3912SClient(new DefaultCommandRunner(transport));

    const result = await client.execute("sys version");

    expect(Object.keys(result).sort()).toEqual(["command", "stderr", "stdout"]);
    expect("exitCode" in result).toBe(false);
  });
});
