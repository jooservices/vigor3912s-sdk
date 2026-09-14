/**
 * `ARCH#Item-3` no-logging proof: drives a canary string through the fully
 * composed `DefaultCommandRunner` (and through `Vigor3912SClient#execute()`)
 * across every failure path, asserting the canary never appears in any
 * thrown error's `message`, `cause`, or serialized (`String()`/
 * `JSON.stringify`) form. There is no logger/`console` call anywhere for the
 * canary to leak through in the first place -- this test proves the other
 * half: that error surfaces themselves never carry command/output content.
 */
import { describe, expect, it } from "vitest";

import { Vigor3912SClient } from "../../src/client.js";
import { DefaultCommandRunner } from "../../src/internal/execution/default-runner.js";
import { defaultExecutionLimits } from "../../src/internal/execution/limits.js";
import { SessionQueue } from "../../src/internal/execution/session-queue.js";
import { FakeTransport, exchange } from "../support/fake-transport.js";

const CANARY = "CANARY-2f9b3e7c-do-not-leak";

function describeCause(cause: unknown): string {
  if (cause === undefined) {
    return "";
  }
  if (cause instanceof Error) {
    return cause.message;
  }
  if (typeof cause === "string") {
    return cause;
  }
  try {
    return JSON.stringify(cause);
  } catch {
    return "";
  }
}

function assertNoCanaryLeak(error: unknown): void {
  expect(error).toBeInstanceOf(Error);
  const err = error as Error & { code?: unknown };

  expect(err.message).not.toContain(CANARY);
  expect(describeCause(err.cause)).not.toContain(CANARY);
  expect(err.toString()).not.toContain(CANARY);
  expect(JSON.stringify({ message: err.message, code: err.code })).not.toContain(CANARY);
}

describe("no-output-leak: canary never surfaces in any thrown error", () => {
  it("framing rejection path", async () => {
    const transport = new FakeTransport();
    const runner = new DefaultCommandRunner(transport);

    try {
      await runner.run(`${CANARY};`);
      expect.unreachable("expected framing rejection");
    } catch (error) {
      assertNoCanaryLeak(error);
    }
  });

  it("maxCommandBytes rejection path", async () => {
    const transport = new FakeTransport();
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      maxCommandBytes: 4,
    });

    try {
      await runner.run(CANARY);
      expect.unreachable("expected command-too-large rejection");
    } catch (error) {
      assertNoCanaryLeak(error);
    }
  });

  it("output_limit_exceeded path (canary present in oversized transport output)", async () => {
    const transport = new FakeTransport({ responses: [exchange(CANARY.repeat(1000))] });
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      maxOutputBytes: 16,
    });

    try {
      await runner.run("show status");
      expect.unreachable("expected output limit rejection");
    } catch (error) {
      assertNoCanaryLeak(error);
    }
  });

  it("session_closed path (queue closed) never echoes a canary-bearing close reason", async () => {
    const transport = new FakeTransport();
    const runner = new DefaultCommandRunner(transport);
    await runner.close(CANARY);

    try {
      await runner.run("show status");
      expect.unreachable("expected session_closed rejection");
    } catch (error) {
      assertNoCanaryLeak(error);
    }
  });

  it("session_closed path (SessionQueue directly, canary as close reason)", async () => {
    const queue = new SessionQueue();
    queue.close(CANARY);

    try {
      await queue.enqueue(() => Promise.resolve("x"));
      expect.unreachable("expected session_closed rejection");
    } catch (error) {
      assertNoCanaryLeak(error);
    }
  });

  it("transport failure path: the command carries the canary, but the transport's own (unrelated) failure and the runner never echo it", async () => {
    const transport = new FakeTransport({
      responder: () => {
        // A transport-level failure unrelated to command/output content
        // (e.g. a connection reset) -- the canary lives only in the command
        // that was being sent, never in the failure itself or in anything
        // the runner adds on top of it.
        throw new Error("transport connection reset");
      },
    });
    const runner = new DefaultCommandRunner(transport);

    try {
      await runner.run(`show status ${CANARY}`);
      expect.unreachable("expected transport failure to propagate");
    } catch (error) {
      assertNoCanaryLeak(error);
    }
  });

  it("via Vigor3912SClient#execute(): framing rejection never leaks the canary", async () => {
    const transport = new FakeTransport();
    const runner = new DefaultCommandRunner(transport);
    const client = new Vigor3912SClient(runner);

    try {
      await client.execute(`${CANARY}|show status`);
      expect.unreachable("expected framing rejection");
    } catch (error) {
      assertNoCanaryLeak(error);
    }
  });

  it("via Vigor3912SClient#execute(): output_limit_exceeded never leaks the canary", async () => {
    const transport = new FakeTransport({ responses: [exchange(CANARY.repeat(1000))] });
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      maxOutputBytes: 16,
    });
    const client = new Vigor3912SClient(runner);

    try {
      await client.execute("show status");
      expect.unreachable("expected output limit rejection");
    } catch (error) {
      assertNoCanaryLeak(error);
    }
  });
});
