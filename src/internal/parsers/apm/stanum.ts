/**
 * Parser for `apm stanum <AP_Index>` (`cli.apm.stanum`, rawLine 12241).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5). Sample response shape taken
 * verbatim from the documented example at that rawLine:
 *
 * ```
 * %          Idx Nearby(2.4/5G) Conn(2.4/5G)
 * %           1   2   5          0   0
 * %           2   2   5          1   0
 * %           3   2   5          1   0
 * ```
 */

export interface ApmStationCountRow {
  readonly index: number;
  readonly nearby24G: number;
  readonly nearby5G: number;
  readonly connected24G: number;
  readonly connected5G: number;
}

export interface ApmStationCountReport {
  readonly rows: readonly ApmStationCountRow[];
}

const DATA_ROW_PATTERN = /^%?\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/;

export function parseStanum(text: string): ApmStationCountReport {
  const rows = text
    .split(/\r?\n/)
    .map((line) => DATA_ROW_PATTERN.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({
      index: Number(match[1]),
      nearby24G: Number(match[2]),
      nearby5G: Number(match[3]),
      connected24G: Number(match[4]),
      connected5G: Number(match[5]),
    }));

  return { rows };
}
