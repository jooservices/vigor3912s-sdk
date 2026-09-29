/**
 * Pure parser for `sys cfg status` (`cli.sys.cfg.status`, classification
 * "read"). Signature `(text: string) => TOutput`, no I/O.
 *
 * Sample text (`cli-reference-raw.txt`, rawLine 7908):
 * ```
 * Profile version: 4.0.7    Status: 1 (0x491e5e6c)
 * ```
 */

export interface SysCfgStatus {
  /** `null` when the line is missing from the output. */
  readonly profileVersion: string | null;
  readonly status: string | null;
}

const PATTERN = /Profile version:\s*(?<profileVersion>\S+)\s+Status:\s*(?<status>.+?)\s*$/m;

export function parseSysCfgStatus(text: string): SysCfgStatus {
  const match = PATTERN.exec(text);

  return {
    profileVersion: match?.groups?.profileVersion ?? null,
    status: match?.groups?.status ?? null,
  };
}
