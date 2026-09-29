/**
 * Pure parser for `sys max_session` (`cli.sys.maxsession`, classification
 * "read").
 *
 * Sibling-live-verified bare/query form (`sys max_session`, no args). The
 * vendor PDF documents only the SET form (`sys max_session <300K/500K/1000K>`);
 * the bare query is live-observed. Output is free-form acknowledgement /
 * current-value text -- return the trimmed raw text (YAGNI).
 */

import { parseRawText, type RawCommandOutput } from "../raw-text.js";

export type SysMaxSession = RawCommandOutput;

export const parseSysMaxSession: (text: string) => SysMaxSession = parseRawText;
