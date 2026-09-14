/**
 * Parser for `csm appe show` (`cli.csm.appe.show`, rawLine 93) -- the
 * family's one read operation.
 *
 * Pure `(text: string) => CsmAppeShowReport` (`ARCHITECTURE.md` Item 5's
 * parser signature). The documented sample output (same rawLine) is a
 * fixed-width table with a `Type`/`Index`/`Name`/`Version` header, one row
 * per application, where every column is separated by a run of two or more
 * spaces and `Name` itself may contain a single internal space (e.g. "IBM
 * Informix", "IMAP/IMAP STARTTLS") -- splitting each line on runs of 2+
 * spaces therefore recovers the documented columns without guessing at a
 * fixed column width. `Version` is optional per the documented sample (many
 * rows have none). Non-data lines (the header row, `---` separators, the
 * `--- MORE ---` pager prompt, the `Total N APPs` footer, and the trailing
 * `>` prompt) are skipped by requiring the second column to be a bare
 * integer, which none of those lines are.
 */

export interface CsmAppeShowRow {
  readonly type: string;
  readonly index: number;
  readonly name: string;
  readonly version?: string;
}

export interface CsmAppeShowReport {
  readonly rows: readonly CsmAppeShowRow[];
}

const INTEGER_PATTERN = /^\d+$/;

export function parseAppeShow(text: string): CsmAppeShowReport {
  const rows: CsmAppeShowRow[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const parts = trimmed.split(/\s{2,}/).filter((part) => part.length > 0);
    const [type, indexText, name, version] = parts;

    if (
      parts.length < 3 ||
      type === undefined ||
      indexText === undefined ||
      name === undefined ||
      !INTEGER_PATTERN.test(indexText)
    ) {
      continue;
    }

    rows.push(
      version === undefined
        ? { type, index: Number(indexText), name }
        : { type, index: Number(indexText), name, version },
    );
  }

  return { rows };
}
