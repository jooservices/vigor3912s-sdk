/**
 * Pure parser for `sys pollbuf` (`cli.sys.pollbuf`, classification "read").
 *
 * Sibling-live-verified bare/query form (`sys pollbuf`, no args). The vendor
 * PDF documents only the SET forms (`sys pollbuf on|off`); the bare query is
 * live-observed. Output shape is free-form acknowledgement text -- return the
 * trimmed raw text rather than inventing structure (YAGNI).
 */

import { parseRawText, type RawCommandOutput } from "../raw-text.js";

export type SysPollbuf = RawCommandOutput;

export const parseSysPollbuf: (text: string) => SysPollbuf = parseRawText;
