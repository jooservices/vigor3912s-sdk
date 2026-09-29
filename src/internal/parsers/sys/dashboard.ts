/**
 * Pure parser for `sys dashboard` (`cli.sys.dashboard`, classification
 * "read").
 *
 * Sibling-live-verified bare/query form (`sys dashboard`, no args). The
 * vendor PDF also documents SET (`-0`..`-a`) and `show` forms; this
 * operation only models the live-observed bare query. Output is free-form
 * section status text -- return the trimmed raw text (YAGNI).
 */

import { parseRawText, type RawCommandOutput } from "../raw-text.js";

export type SysDashboard = RawCommandOutput;

export const parseSysDashboard: (text: string) => SysDashboard = parseRawText;
