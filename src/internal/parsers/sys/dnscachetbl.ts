/**
 * Pure parser for `sys dnsCacheTbl` (`cli.sys.dnscachetbl`, classification
 * "read").
 *
 * Sibling-live-verified bare/query form (`sys dnsCacheTbl`, no args). The
 * vendor PDF also documents `-l`/`-s` SET/filter forms; this operation only
 * models the live-observed bare query. Output is a free-form cache table --
 * return the trimmed raw text (YAGNI).
 */

import { parseRawText, type RawCommandOutput } from "../raw-text.js";

export type SysDnsCacheTbl = RawCommandOutput;

export const parseSysDnsCacheTbl: (text: string) => SysDnsCacheTbl = parseRawText;
