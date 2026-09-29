import type { CommandFrame } from "./framing.js";
import type { ExecutionLimits } from "./limits.js";

/**
 * A single command/response exchange, as consumed by parsers and the runner.
 * Deliberately carries no exit-code field (`ARCH#RDL` B1).
 */
export interface CommandExchange {
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * What a `Transport` hands back for one `send()`. Structurally identical to
 * `CommandExchange` today; kept as a distinct name per the architecture so a
 * transport can attach transport-only detail (e.g. raw framing
 * artifacts) without widening the parser-facing `CommandExchange` shape.
 */
export type TransportExchange = CommandExchange;

/** Network peer of a transport session. */
export interface TransportEndpoint {
  /** IP literal of the peer actually connected to (not a hostname). */
  readonly address: string;
  readonly port: number;
}

/** One piece of output streamed by `Transport.stream`, in arrival order. */
export interface TransportChunk {
  readonly stream: "stdout" | "stderr";
  readonly data: string;
}

/**
 * Wire boundary consumed by the SDK runner and implemented outside this SDK.
 *
 * Each `send()` call represents exactly one SDK-framed DrayOS CLI command and
 * must resolve to exactly one exchange. The SDK rejects command chaining before
 * a frame is created; the transport owns only the interactive-session details
 * needed to send that frame and collect its prompt-delimited output.
 *
 * Implementors must honor the supplied `AbortSignal` and execution limits. The
 * runner checks `isOpen` before dispatch and calls `close(reason)` when it
 * deliberately closes the session, for example after an output-limit failure.
 */
export interface Transport {
  /** Whether the session can accept another exchange. */
  readonly isOpen: boolean;

  /**
   * The peer this session is connected to (resolved IP, not a hostname).
   * Optional for general use; `LiveReadOnlyClient` requires it and binds its
   * LAN-only policy to it before every command.
   */
  readonly remoteEndpoint?: TransportEndpoint | undefined;

  /**
   * Send one SDK-created frame and resolve with one exchange. Do not fabricate
   * exit codes; DrayOS outcome text belongs in `stdout`/`stderr`.
   */
  send(
    frame: CommandFrame,
    limits: ExecutionLimits,
    signal: AbortSignal,
  ): Promise<TransportExchange>;

  /**
   * Optional streaming form of `send()`: yield output chunks as they arrive
   * and finish when the prompt returns. When present the runner uses it
   * instead of `send()` and enforces `maxOutputBytes` and `idleTimeoutMs`
   * while output is still arriving, so an oversized or stalled response is
   * stopped before it is buffered. With `send()` alone those two limits can
   * only be checked after the transport returns.
   */
  stream?(
    frame: CommandFrame,
    limits: ExecutionLimits,
    signal: AbortSignal,
  ): AsyncIterable<TransportChunk>;

  /** Close the session; `reason` is diagnostic text, not a router command. */
  close(reason: string): Promise<void>;
}
