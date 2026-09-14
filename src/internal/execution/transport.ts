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
 * future real transport can attach transport-only detail (e.g. raw framing
 * artifacts) without widening the parser-facing `CommandExchange` shape.
 */
export type TransportExchange = CommandExchange;

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
   * Send one SDK-created frame and resolve with one exchange. Do not fabricate
   * exit codes; DrayOS outcome text belongs in `stdout`/`stderr`.
   */
  send(
    frame: CommandFrame,
    limits: ExecutionLimits,
    signal: AbortSignal,
  ): Promise<TransportExchange>;

  /** Close the session; `reason` is diagnostic text, not a router command. */
  close(reason: string): Promise<void>;
}
