/**
 * Parser for `ddns log` (`cli.ddns.log`, rawLine 749) -- "Displays the DDNS
 * log."; the documented example shows no structured content (the command's
 * own sample output is simply the bare prompt), so this stays a raw-text
 * DTO like the family's write operations rather than inventing a log-entry
 * schema the vendor documentation does not support.
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLog(text: string): RawCommandOutput {
  return parseRawText(text);
}
