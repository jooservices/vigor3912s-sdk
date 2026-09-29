/**
 * Pure parser for `sys fr_log` (`cli.sys.frlog`, classification "read").
 *
 * Documented no-argument display of failure-related / Syslog Explorer log
 * text (rawLine 8557). Row set is free-form and not stably structured --
 * return the trimmed raw text (YAGNI).
 */

import { parseRawText, type RawCommandOutput } from "../raw-text.js";

export type SysFrLog = RawCommandOutput;

export const parseSysFrLog: (text: string) => SysFrLog = parseRawText;
