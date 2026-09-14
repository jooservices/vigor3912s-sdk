import { describe, expect, it } from "vitest";

import { SessionQueue } from "../../src/internal/execution/session-queue.js";

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("SessionQueue", () => {
  it("runs items strictly one at a time, in FIFO order", async () => {
    const queue = new SessionQueue();
    const order: string[] = [];
    const first = deferred<undefined>();

    const firstResult = queue.enqueue(async () => {
      order.push("first-start");
      await first.promise;
      order.push("first-end");
      return "first";
    });

    const secondResult = queue.enqueue(() => {
      order.push("second-start");
      return Promise.resolve("second");
    });

    // The second item must not start until the first resolves.
    await Promise.resolve();
    await Promise.resolve();
    expect(order).toEqual(["first-start"]);

    first.resolve(undefined);
    await expect(firstResult).resolves.toBe("first");
    await expect(secondResult).resolves.toBe("second");
    expect(order).toEqual(["first-start", "first-end", "second-start"]);
  });

  it("rejects a still-queued item immediately when its external signal aborts before its turn", async () => {
    const queue = new SessionQueue();
    const controller = new AbortController();
    const blocking = deferred<undefined>();
    const secondTaskStarted = { value: false };

    const firstResult = queue.enqueue(async () => {
      await blocking.promise;
      return "first";
    });

    const secondResult = queue.enqueue(() => {
      secondTaskStarted.value = true;
      return Promise.resolve("second");
    }, controller.signal);

    controller.abort(new Error("removed from queue"));
    blocking.resolve(undefined);

    await expect(firstResult).resolves.toBe("first");
    await expect(secondResult).rejects.toThrow("removed from queue");
    expect(secondTaskStarted.value).toBe(false);
  });

  it("rejects immediately when its external signal is already aborted before it is ever enqueued, using the string reason as the message", async () => {
    const queue = new SessionQueue();
    const controller = new AbortController();
    controller.abort("cancelled before dispatch");

    await expect(
      queue.enqueue(() => Promise.resolve("never runs"), controller.signal),
    ).rejects.toThrow("cancelled before dispatch");
  });

  it("rejects immediately with a default message when the already-aborted signal's reason is not an Error or a string", async () => {
    const queue = new SessionQueue();
    const controller = new AbortController();
    controller.abort({ code: "shutdown" });

    await expect(
      queue.enqueue(() => Promise.resolve("never runs"), controller.signal),
    ).rejects.toThrow("Command was aborted.");
  });

  it("rejects immediately with session_closed once the queue is closed", async () => {
    const queue = new SessionQueue();
    queue.close("done");

    await expect(queue.enqueue(() => Promise.resolve("x"))).rejects.toMatchObject({
      code: "session_closed",
    });
  });

  it("exposes closed/closeReason reflecting the pre- and post-close() state", () => {
    const queue = new SessionQueue();

    expect(queue.closed).toBe(false);
    expect(queue.closeReason).toBeUndefined();

    queue.close("transport disconnected");

    expect(queue.closed).toBe(true);
    expect(queue.closeReason).toBe("transport disconnected");
  });

  it("lets items already accepted before close() run to completion, but rejects enqueue() calls made after close()", async () => {
    const queue = new SessionQueue();
    const blocking = deferred<undefined>();

    const firstResult = queue.enqueue(async () => {
      await blocking.promise;
      return "first";
    });
    const secondResult = queue.enqueue(() => Promise.resolve("second"));

    queue.close("closed mid-flight");
    blocking.resolve(undefined);

    await expect(firstResult).resolves.toBe("first");
    await expect(secondResult).resolves.toBe("second");
    await expect(queue.enqueue(() => Promise.resolve("third"))).rejects.toMatchObject({
      code: "session_closed",
    });
  });
});
