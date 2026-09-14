/**
 * Pure parser for `sys fr_log` (`cli.sys.frlog`, classification "read").
 *
 * Documented no-argument display of failure-related / Syslog Explorer log
 * text (rawLine 8557). Row set is free-form and not stably structured --
 * return the trimmed raw text (YAGNI).
 */

export interface SysFrLog {
  readonly raw: string;
}

export function parseSysFrLog(text: string): SysFrLog {
  return { raw: text.trim() };
}
