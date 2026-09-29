/**
 * DrayOS CLI outcome detection. DrayOS reports most failures as a `%`-prefixed
 * line on stdout and still returns the prompt, so a transport exchange that
 * "succeeded" can carry a rejected command. Successful acknowledgements such
 * as `% ... done.` and data lines such as `% Current Session Usage` must not
 * match — only the explicit failure forms below do.
 *
 * Patterns: `vigor3912s-mcp` `router-cli-result.ts` (live-verified on fw
 * 4.4.7_RC2) plus `% Insufficient arguments !!!` and the `% Valid
 * (sub)commands are` help listing that DrayOS prints for an incomplete
 * command (`vigor3912s-mcp/recon-output/`).
 */

import type { CommandExchange } from "./transport.js";

export type CliRejectionKind =
  | "stderr"
  | "invalid"
  | "unknown"
  | "incomplete"
  | "error"
  | "command-not-found"
  | "insufficient-arguments"
  | "usage"
  | "help-listing";

const REJECTION_PATTERNS: readonly (readonly [RegExp, CliRejectionKind])[] = [
  [/^%%?\s*Invalid\b/i, "invalid"],
  [/^%%?\s*Unknown\b/i, "unknown"],
  [/^%%?\s*Incomplete\b/i, "incomplete"],
  [/^%%?\s*Error\b/i, "error"],
  [/^%%?\s*Command not found\b/i, "command-not-found"],
  [/^%\s*Insufficient arguments\b/i, "insufficient-arguments"],
  // Arity hints, e.g. bare `sys name` -> "% input wan1/wan2 to set name".
  [/^%\s*input\b/i, "usage"],
  [/^%\s*Valid (sub)?commands are\b/i, "help-listing"],
];

/**
 * Returns why DrayOS rejected the command, or `undefined` when the exchange
 * looks like a normal result. Any non-empty `stderr` counts as a rejection.
 */
export function detectCliRejection(exchange: CommandExchange): CliRejectionKind | undefined {
  if (exchange.stderr.trim().length > 0) {
    return "stderr";
  }

  for (const line of exchange.stdout.split(/\r\n|\r|\n/)) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("%")) {
      continue;
    }

    const match = REJECTION_PATTERNS.find(([pattern]) => pattern.test(trimmed));

    if (match !== undefined) {
      return match[1];
    }
  }

  return undefined;
}
