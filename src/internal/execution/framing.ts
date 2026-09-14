/**
 * Command framing (`ARCHITECTURE.md`, "Item 3 — execute() safety envelope").
 *
 * `frameSingleCommand` is a pure function that either returns a branded,
 * unforgeable `CommandFrame` or throws a `Vigor3912SError` with code
 * `command_framing_rejected`. It never rewrites, escapes, or sanitizes the
 * input -- it only accepts or rejects it whole, per the architecture's
 * "framing rejects, never escapes" rule.
 *
 * Branding uses a module-private `unique symbol` that is never
 * exported, so no other module can construct a `CommandFrame` via an object
 * literal or type assertion without importing this file's own cast below.
 * This file is the only place a `CommandFrame` is minted.
 */

import { Vigor3912SError, sdkErrorCodes } from "../../errors.js";

declare const frameBrand: unique symbol;

export interface CommandFrame {
  readonly [frameBrand]: true;
  readonly command: string;
}

/**
 * C0 controls (incl. LF/CR), DEL, and C1 controls -- the Unicode "Control"
 * general category (`Cc`) covers exactly U+0000-001F, U+007F, and
 * U+0080-009F, so this is expressed via a Unicode property escape rather
 * than a literal control-character class (which most lint configs flag).
 */
const CONTROL_CHAR_PATTERN = /\p{Cc}/u;

/**
 * Sequence-based rejects. `;`, `&`, `|`, and backtick are single characters;
 * `$(` is a two-character command-substitution opener. None of these are
 * confused with the explicit carve-out below: bare `?` and a trailing
 * `<cmd> ?` are documented recon primitives and must keep working.
 */
const DISALLOWED_SEQUENCES = [";", "&", "|", "`", "$("] as const;

function rejected(message: string): Vigor3912SError {
  return new Vigor3912SError(sdkErrorCodes.commandFramingRejected, message);
}

export function frameSingleCommand(input: string): CommandFrame {
  if (input.trim().length === 0) {
    throw rejected("Command must not be empty or whitespace-only.");
  }

  if (CONTROL_CHAR_PATTERN.test(input)) {
    throw rejected(
      "Command must not contain control characters (including LF/CR/NUL and other C0/C1 controls).",
    );
  }

  for (const sequence of DISALLOWED_SEQUENCES) {
    if (input.includes(sequence)) {
      throw rejected(`Command must not contain the disallowed sequence "${sequence}".`);
    }
  }

  return { command: input } as CommandFrame;
}
