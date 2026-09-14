/**
 * Shared, reusable in-memory fake `Transport` (`ARCH#Item-3`) for all
 * execution-layer tests. Deterministic and scriptable: responses are either
 * a fixed FIFO queue or a caller-supplied responder function, so tests
 * (including the canary-string no-logging proof in
 * `tests/execution/no-output-leak.test.ts`) can control exactly what a
 * "router" appears to say without any real transport or network.
 */

import type { CommandFrame } from "../../src/internal/execution/framing.js";
import type { ExecutionLimits } from "../../src/internal/execution/limits.js";
import type {
  CommandExchange,
  Transport,
  TransportExchange,
} from "../../src/internal/execution/transport.js";

export type FakeTransportResponder = (
  frame: CommandFrame,
  limits: ExecutionLimits,
  signal: AbortSignal,
) => TransportExchange | Promise<TransportExchange>;

export interface FakeTransportCall {
  readonly command: string;
  readonly limits: ExecutionLimits;
}

export interface FakeTransportOptions {
  /** Scriptable per-call responder; takes precedence over `responses`. */
  readonly responder?: FakeTransportResponder;
  /** FIFO canned responses, consumed one per `send()` call. */
  readonly responses?: readonly TransportExchange[];
}

export function exchange(stdout: string, stderr = ""): CommandExchange {
  return { stdout, stderr };
}

export class FakeTransport implements Transport {
  #open = true;
  readonly #queue: TransportExchange[];
  readonly #responder: FakeTransportResponder | undefined;
  public readonly calls: FakeTransportCall[] = [];
  public closeReason: string | undefined;

  public constructor(options: FakeTransportOptions = {}) {
    this.#queue = options.responses !== undefined ? [...options.responses] : [];
    this.#responder = options.responder;
  }

  public get isOpen(): boolean {
    return this.#open;
  }

  public send(
    frame: CommandFrame,
    limits: ExecutionLimits,
    signal: AbortSignal,
  ): Promise<TransportExchange> {
    if (!this.#open) {
      return Promise.reject(new Error("FakeTransport is closed."));
    }
    if (signal.aborted) {
      return Promise.reject(new Error("FakeTransport send was aborted before dispatch."));
    }

    this.calls.push({ command: frame.command, limits });

    if (this.#responder !== undefined) {
      return Promise.resolve(this.#responder(frame, limits, signal));
    }

    const next = this.#queue.shift();
    return Promise.resolve(next ?? exchange(""));
  }

  public close(reason: string): Promise<void> {
    this.#open = false;
    this.closeReason = reason;
    return Promise.resolve();
  }
}

/** Convenience factory mirroring `FakeTransport`'s constructor. */
export function createFakeTransport(options: FakeTransportOptions = {}): FakeTransport {
  return new FakeTransport(options);
}

/**
 * A responder that never settles until aborted -- useful for
 * `commandTimeoutMs`/idle-timeout style tests. Rejects once `signal` fires.
 */
export function createHangingResponder(): FakeTransportResponder {
  return (_frame, _limits, signal) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener(
        "abort",
        () => {
          reject(new Error("FakeTransport hanging responder aborted."));
        },
        { once: true },
      );
    });
}
