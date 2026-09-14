import { describe, expect, it, vi } from "vitest";

import { DefaultCommandRunner } from "../../src/internal/execution/default-runner.js";
import { defaultExecutionLimits } from "../../src/internal/execution/limits.js";
import { FakeTransport, createHangingResponder, exchange } from "../support/fake-transport.js";

describe("DefaultCommandRunner", () => {
  it("dispatches a well-formed command to the transport and returns its result", async () => {
    const transport = new FakeTransport({ responses: [exchange("ok output")] });
    const runner = new DefaultCommandRunner(transport);

    const result = await runner.run("show status");

    expect(result).toEqual({ command: "show status", stdout: "ok output", stderr: "" });
    expect(transport.calls).toEqual([{ command: "show status", limits: defaultExecutionLimits }]);
  });

  it("rejects a command that fails framing before ever reaching the transport", async () => {
    const transport = new FakeTransport();
    const runner = new DefaultCommandRunner(transport);

    await expect(runner.run("show status; show session")).rejects.toMatchObject({
      code: "command_framing_rejected",
    });
    expect(transport.calls).toEqual([]);
  });

  it("rejects a command exceeding maxCommandBytes without reaching the transport", async () => {
    const transport = new FakeTransport();
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      maxCommandBytes: 8,
    });

    await expect(runner.run("show status")).rejects.toMatchObject({
      code: "command_framing_rejected",
    });
    expect(transport.calls).toEqual([]);
  });

  it("lowers commandTimeoutMs via ExecuteOptions.timeoutMs but never raises it", async () => {
    const transport = new FakeTransport({ responses: [exchange("ok")] });
    const runner = new DefaultCommandRunner(transport);

    await runner.run("show status", { timeoutMs: 999_999 });

    expect(transport.calls[0]?.limits.commandTimeoutMs).toBe(
      defaultExecutionLimits.commandTimeoutMs,
    );
  });

  it("throws execution_timeout when the transport never responds within commandTimeoutMs", async () => {
    vi.useFakeTimers();
    try {
      const transport = new FakeTransport({ responder: createHangingResponder() });
      const runner = new DefaultCommandRunner(transport, {
        ...defaultExecutionLimits,
        commandTimeoutMs: 50,
      });

      const resultPromise = runner.run("show status");
      const assertion = expect(resultPromise).rejects.toMatchObject({
        code: "execution_timeout",
      });

      await vi.advanceTimersByTimeAsync(50);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws output_limit_exceeded and closes the session without truncating on overflow", async () => {
    const transport = new FakeTransport({ responses: [exchange("x".repeat(20))] });
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      maxOutputBytes: 10,
    });

    await expect(runner.run("show status")).rejects.toMatchObject({
      code: "output_limit_exceeded",
    });
    expect(transport.isOpen).toBe(false);
    expect(transport.closeReason).toBe("output_limit_exceeded");

    await expect(runner.run("show status")).rejects.toMatchObject({
      code: "session_closed",
    });
  });

  it("runWithOverride raises the ceiling above the 15s default only for that call, never via ExecuteOptions on run()", async () => {
    const transport = new FakeTransport({ responses: [exchange("pong")] });
    const runner = new DefaultCommandRunner(transport);

    await runner.runWithOverride("ip ping 192.0.2.1", { commandTimeoutMs: 60_000 });

    expect(transport.calls[0]?.limits.commandTimeoutMs).toBe(60_000);

    await runner.run("show status", { timeoutMs: 60_000 });

    expect(transport.calls[1]?.limits.commandTimeoutMs).toBe(
      defaultExecutionLimits.commandTimeoutMs,
    );
  });

  it("rejects immediately when the transport is already closed", async () => {
    const transport = new FakeTransport();
    await transport.close("pre-closed");
    const runner = new DefaultCommandRunner(transport);

    await expect(runner.run("show status")).rejects.toMatchObject({
      code: "session_closed",
    });
  });

  it("serializes concurrent run() calls through the session queue (max concurrency 1)", async () => {
    const order: string[] = [];
    const transport = new FakeTransport({
      responder: (frame) => {
        order.push(`start:${frame.command}`);
        order.push(`end:${frame.command}`);
        return exchange("ok");
      },
    });
    const runner = new DefaultCommandRunner(transport);

    await Promise.all([runner.run("show status"), runner.run("show session")]);

    expect(order).toEqual([
      "start:show status",
      "end:show status",
      "start:show session",
      "end:show session",
    ]);
  });
});
