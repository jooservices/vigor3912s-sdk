/**
 * Shared structured parser for `mngt telnettimeout <value>` and
 * `mngt sshtimeout <value>` (`cli.mngt.telnettimeout`, `cli.mngt.sshtimeout`,
 * both classification "write"). Both document the identical single-line
 * acknowledgement shape (`cli-reference-raw.txt`, rawLine 4573/4584):
 *
 * ```
 * % Telnet timeout : 100s
 * % SSH timeout : 200s
 * ```
 *
 * A shared parser avoids duplicating the same regex for two operations
 * (DRY) -- it is intentionally label-agnostic (matches either "Telnet
 * timeout" or "SSH timeout").
 */

export interface MngtTimeoutAck {
  readonly seconds: number | null;
}

const PATTERN = /timeout\s*:\s*(?<seconds>\d+)s/i;

export function parseMngtTimeoutAck(text: string): MngtTimeoutAck {
  const match = PATTERN.exec(text);
  const seconds = match?.groups?.seconds;

  return { seconds: seconds === undefined ? null : Number(seconds) };
}
