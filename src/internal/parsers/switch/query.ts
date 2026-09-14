/**
 * Parser for `switch query` (`cli.switch.query`, rawLine 7770).
 *
 * See `src/domains/switch.ts` for why the operation only models the bare
 * (no-argument) form of this heading.
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseQuery(text: string): RawCommandOutput {
  return parseRawText(text);
}
