/**
 * `SessionQueue` (`ARCHITECTURE.md`, "Item 3"): FIFO promise-chain queue,
 * max concurrency 1, no mutex library (YAGNI -- a single chained promise is
 * sufficient to serialize access to one interactive DrayOS CLI session).
 *
 * - Items run strictly one at a time, in enqueue order.
 * - Passing an `externalSignal` lets a caller remove a still-queued item: if
 *   the signal aborts before the item's turn arrives, the item is skipped
 *   (rejected) without ever invoking its task.
 * - Once `close()` is called, every subsequent `enqueue()` call rejects
 *   immediately with `session_closed`. Items already accepted by `enqueue()`
 *   before `close()` was called still run to completion (or to their own
 *   abort/timeout outcome) -- `close()` does not reach back into the chain
 *   and cancel work already committed to it.
 */

import { Vigor3912SError, sdkErrorCodes } from "../../errors.js";

function sessionClosedError(): Vigor3912SError {
  return new Vigor3912SError(
    sdkErrorCodes.sessionClosed,
    "Session queue is closed; command was rejected.",
  );
}

function toAbortError(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason;
  }
  return new Error(typeof reason === "string" ? reason : "Command was aborted.");
}

export class SessionQueue {
  #closed = false;
  #closeReason: string | undefined;
  #tail: Promise<unknown> = Promise.resolve();

  public get closed(): boolean {
    return this.#closed;
  }

  /**
   * The reason passed to `close()`, if any. Exposed for callers/tests that
   * want to confirm *why* a session ended; never logged and never included
   * in any rejection message (no-logging, `ARCH#Item-3`).
   */
  public get closeReason(): string | undefined {
    return this.#closeReason;
  }

  public enqueue<T>(
    task: (signal: AbortSignal) => Promise<T>,
    externalSignal?: AbortSignal,
  ): Promise<T> {
    if (this.#closed) {
      return Promise.reject(sessionClosedError());
    }

    if (externalSignal?.aborted === true) {
      return Promise.reject(toAbortError(externalSignal.reason));
    }

    const controller = new AbortController();
    const forwardAbort = (): void => {
      controller.abort(externalSignal?.reason);
    };
    externalSignal?.addEventListener("abort", forwardAbort, { once: true });

    const run = (): Promise<T> => {
      if (controller.signal.aborted) {
        return Promise.reject(toAbortError(controller.signal.reason));
      }
      return task(controller.signal);
    };

    const settled = this.#tail.then(run, run);

    // Keep the chain alive regardless of this item's outcome, so a failure
    // never stalls subsequently queued items.
    this.#tail = settled.then(
      () => undefined,
      () => undefined,
    );

    settled
      .finally(() => {
        externalSignal?.removeEventListener("abort", forwardAbort);
      })
      .catch(() => {
        // The caller of `enqueue()` observes `settled` directly (returned
        // below); this branch exists only so cleanup-after-rejection never
        // surfaces as a separate unhandled rejection.
      });

    return settled;
  }

  public close(reason: string): void {
    this.#closed = true;
    this.#closeReason = reason;
  }
}
