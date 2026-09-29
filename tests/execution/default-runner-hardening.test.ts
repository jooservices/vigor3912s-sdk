import { afterEach, describe, expect, it, vi } from "vitest";

import { DefaultCommandRunner } from "../../src/internal/execution/default-runner.js";
import type { CommandFrame } from "../../src/internal/execution/framing.js";
import { defaultExecutionLimits } from "../../src/internal/execution/limits.js";
import type {
  Transport,
  TransportChunk,
  TransportExchange,
} from "../../src/internal/execution/transport.js";

interface ScriptedTransport extends Transport {
  isOpen: boolean;
  readonly closeReasons: string[];
  returned: boolean;
}

/** A transport whose send()/stream() each test scripts; records close() reasons. */
function scriptedTransport(script: {
  readonly send?: (frame: CommandFrame, signal: AbortSignal) => Promise<TransportExchange>;
  readonly stream?: (
    frame: CommandFrame,
    signal: AbortSignal,
    onReturn: () => void,
  ) => AsyncIterable<TransportChunk>;
}): ScriptedTransport {
  const transport: ScriptedTransport = {
    isOpen: true,
    closeReasons: [],
    returned: false,
    send: (frame, _limits, signal) =>
      script.send?.(frame, signal) ?? Promise.resolve({ stdout: "", stderr: "" }),
    close: (reason) => {
      transport.isOpen = false;
      transport.closeReasons.push(reason);
      return Promise.resolve();
    },
  };

  if (script.stream !== undefined) {
    const stream = script.stream;

    transport.stream = (frame, _limits, signal) =>
      stream(frame, signal, () => {
        transport.returned = true;
      });
  }

  return transport;
}

function neverSettles(): Promise<never> {
  return new Promise<never>(() => undefined);
}

describe("DefaultCommandRunner hard timeout (transport ignores AbortSignal)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects at the deadline, invalidates the session, and never blocks the queue", async () => {
    vi.useFakeTimers();
    const transport = scriptedTransport({ send: () => neverSettles() });
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      commandTimeoutMs: 50,
    });

    const first = runner.run("show status");
    const second = runner.run("show lan");
    const firstAssertion = expect(first).rejects.toMatchObject({ code: "execution_timeout" });
    const secondAssertion = expect(second).rejects.toMatchObject({ code: "session_closed" });

    await vi.advanceTimersByTimeAsync(50);
    await firstAssertion;
    await secondAssertion;
    expect(transport.closeReasons).toEqual(["execution_timeout"]);
  });

  it("reports the timeout when a cooperative transport rejects after abort", async () => {
    vi.useFakeTimers();
    const transport = scriptedTransport({
      send: (_frame, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            reject(new Error("socket aborted"));
          });
        }),
    });
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      commandTimeoutMs: 20,
    });

    const assertion = expect(runner.run("show status")).rejects.toMatchObject({
      code: "execution_timeout",
    });

    await vi.advanceTimersByTimeAsync(20);
    await assertion;
    expect(transport.closeReasons).toEqual(["execution_timeout"]);
  });

  it("passes non-timeout transport errors through unchanged and keeps the session", async () => {
    const transport = scriptedTransport({
      send: () => Promise.reject(new Error("broken pipe")),
    });
    const runner = new DefaultCommandRunner(transport);

    await expect(runner.run("show status")).rejects.toThrow("broken pipe");
    expect(transport.closeReasons).toEqual([]);
  });
});

describe("DefaultCommandRunner streaming transport", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("assembles stdout and stderr chunks in arrival order", async () => {
    const transport = scriptedTransport({
      stream: async function* () {
        await Promise.resolve();
        yield { stream: "stdout", data: "line 1\n" };
        yield { stream: "stderr", data: "warn\n" };
        yield { stream: "stdout", data: "line 2\n" };
      },
    });
    const runner = new DefaultCommandRunner(transport);

    await expect(runner.run("show status")).resolves.toEqual({
      command: "show status",
      stdout: "line 1\nline 2\n",
      stderr: "warn\n",
    });
  });

  it("stops an oversized response mid-stream, before buffering the rest", async () => {
    let produced = 0;
    const transport = scriptedTransport({
      stream: async function* (_frame, _signal, onReturn) {
        try {
          for (;;) {
            await Promise.resolve();
            produced += 1;
            yield { stream: "stdout", data: "x".repeat(8) };
          }
        } finally {
          onReturn();
        }
      },
    });
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      maxOutputBytes: 20,
    });

    await expect(runner.run("show status")).rejects.toMatchObject({
      code: "output_limit_exceeded",
    });
    expect(produced).toBe(3);
    expect(transport.returned).toBe(true);
    expect(transport.closeReasons).toEqual(["output_limit_exceeded"]);
  });

  it("enforces idleTimeoutMs between chunks and invalidates the session", async () => {
    vi.useFakeTimers();
    const transport = scriptedTransport({
      stream: async function* () {
        yield { stream: "stdout", data: "partial" };
        await neverSettles();
      },
    });
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      idleTimeoutMs: 30,
      commandTimeoutMs: 10_000,
    });

    const assertion = expect(runner.run("show status")).rejects.toThrow(/idleTimeoutMs/);

    await vi.advanceTimersByTimeAsync(30);
    await assertion;
    expect(transport.closeReasons).toEqual(["execution_timeout"]);
  });

  it("enforces commandTimeoutMs across a slow but never-idle stream", async () => {
    vi.useFakeTimers();
    const transport = scriptedTransport({
      stream: async function* () {
        for (;;) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          yield { stream: "stdout", data: "." };
        }
      },
    });
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      idleTimeoutMs: 50,
      commandTimeoutMs: 100,
    });

    const assertion = expect(runner.run("show status")).rejects.toThrow(/commandTimeoutMs/);

    await vi.advanceTimersByTimeAsync(100);
    await assertion;
  });
});

describe("DefaultCommandRunner caller abort mid-exchange", () => {
  it("settles on abort even when the transport ignores its AbortSignal", async () => {
    let sent = false;
    const transport = scriptedTransport({
      send: () => {
        sent = true;
        return neverSettles();
      },
    });
    const runner = new DefaultCommandRunner(transport);
    const controller = new AbortController();
    const pending = runner.run("sys version", { signal: controller.signal });

    await vi.waitFor(() => {
      expect(sent).toBe(true);
    });
    controller.abort(new Error("caller gave up"));

    await expect(pending).rejects.toThrow("caller gave up");
    await vi.waitFor(() => {
      expect(transport.closeReasons).toEqual(["aborted"]);
    });
  });

  it("invalidates the session when a cooperative transport rejects on abort", async () => {
    let sent = false;
    const transport = scriptedTransport({
      send: (_frame, signal) =>
        new Promise<never>((_resolve, reject) => {
          sent = true;
          signal.addEventListener("abort", () => {
            reject(new Error("transport aborted"));
          });
        }),
    });
    const runner = new DefaultCommandRunner(transport);
    const controller = new AbortController();
    const pending = runner.run("sys version", { signal: controller.signal });

    await vi.waitFor(() => {
      expect(sent).toBe(true);
    });
    controller.abort(new Error("caller gave up"));

    await expect(pending).rejects.toThrow("caller gave up");
    await vi.waitFor(() => {
      expect(transport.closeReasons).toEqual(["aborted"]);
    });
  });

  it("stops a stream on abort", async () => {
    const transport = scriptedTransport({
      // eslint-disable-next-line require-yield -- a stream that never produces
      stream: async function* () {
        await neverSettles();
      },
    });
    const runner = new DefaultCommandRunner(transport);
    const controller = new AbortController();
    const pending = runner.run("sys version", { signal: controller.signal });

    controller.abort(new Error("caller gave up"));

    await expect(pending).rejects.toThrow("caller gave up");
  });
});

describe("DefaultCommandRunner output limit with a hanging close()", () => {
  function hangingClose(transport: ScriptedTransport): ScriptedTransport {
    transport.close = (reason) => {
      transport.closeReasons.push(reason);
      return neverSettles();
    };
    return transport;
  }

  it("rejects on time when the streaming transport's close() never settles", async () => {
    const transport = hangingClose(
      scriptedTransport({
        stream: async function* () {
          await Promise.resolve();
          yield { stream: "stdout", data: "x".repeat(64) };
        },
      }),
    );
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      maxOutputBytes: 8,
    });

    await expect(runner.run("sys version")).rejects.toMatchObject({
      code: "output_limit_exceeded",
    });
    await expect(runner.run("sys version")).rejects.toMatchObject({ code: "session_closed" });
  });

  it("rejects on time when the buffered transport's close() never settles", async () => {
    const transport = hangingClose(
      scriptedTransport({ send: () => Promise.resolve({ stdout: "x".repeat(64), stderr: "" }) }),
    );
    const runner = new DefaultCommandRunner(transport, {
      ...defaultExecutionLimits,
      maxOutputBytes: 8,
    });

    await expect(runner.run("sys version")).rejects.toMatchObject({
      code: "output_limit_exceeded",
    });
  });
});

describe("DefaultCommandRunner limit validation", () => {
  const transport = (): ScriptedTransport => scriptedTransport({});

  it.each([
    { maxOutputBytes: -1 },
    { maxCommandBytes: 0 },
    { commandTimeoutMs: Number.NaN },
    { idleTimeoutMs: 2 ** 31 },
    { commandTimeoutMs: 1.5 },
  ])("rejects base limits %o", (override) => {
    expect(
      () => new DefaultCommandRunner(transport(), { ...defaultExecutionLimits, ...override }),
    ).toThrow(expect.objectContaining({ code: "invalid_options" }) as Error);
  });

  it.each([Number.NaN, -5, 0, Number.POSITIVE_INFINITY, 2 ** 31])(
    "rejects ExecuteOptions.timeoutMs %s",
    async (timeoutMs) => {
      await expect(
        new DefaultCommandRunner(transport()).run("sys version", { timeoutMs }),
      ).rejects.toMatchObject({ code: "invalid_options" });
    },
  );

  it("rejects an invalid executionOverride", async () => {
    await expect(
      new DefaultCommandRunner(transport()).runWithOverride("ip ping 1.1.1.1", {
        commandTimeoutMs: -1,
      }),
    ).rejects.toMatchObject({ code: "invalid_options" });
  });
});
