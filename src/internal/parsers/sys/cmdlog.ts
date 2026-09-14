/**
 * Pure parser for `sys cmdlog` (`cli.sys.cmdlog`, classification "read").
 *
 * Sample text (`cli-reference-raw.txt`, rawLine 7918):
 * ```
 * % Commands Log: (The lowest index is the newest !!!)
 *     [1] sys cmdlog
 *     [2] sys cmdlog ?
 *     [3] sys ?
 *     [4] sys cfg status
 *     [5] sys cfg ?
 * ```
 */

export interface SysCmdLogEntry {
  readonly index: number;
  readonly command: string;
}

export interface SysCmdLog {
  readonly entries: readonly SysCmdLogEntry[];
}

const ENTRY_PATTERN = /^\s*\[(?<index>\d+)\]\s*(?<command>.+?)\s*$/gm;

export function parseSysCmdLog(text: string): SysCmdLog {
  const entries: SysCmdLogEntry[] = [];

  for (const match of text.matchAll(ENTRY_PATTERN)) {
    const indexText = match.groups?.index;
    const command = match.groups?.command;

    if (indexText === undefined || command === undefined) {
      continue;
    }

    entries.push({ index: Number.parseInt(indexText, 10), command });
  }

  return { entries };
}
