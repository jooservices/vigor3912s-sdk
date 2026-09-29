/**
 * Pure parser for `sys qrybuf` (`cli.sys.qrybuf`, classification "read").
 *
 * The documented output (`cli-reference-raw.txt`, rawLine 8093) is a
 * free-form memory/buffer leakage table whose row set and column widths are
 * not stably documented (varies by kernel buffer pool state). Rather than
 * over-fit a table parser to one sample (YAGNI), this returns the trimmed
 * raw text -- still a pure, meaningful transform (whitespace-trims the
 * transport's raw stdout) even though it is not further structured.
 */

import { parseRawText, type RawCommandOutput } from "../raw-text.js";

export type SysQryBuf = RawCommandOutput;

export const parseSysQryBuf: (text: string) => SysQryBuf = parseRawText;
