/**
 * Pure parser for `sys time` (`cli.sys.time`, classification "read").
 *
 * Sibling-live-verified bare/query form (`sys time`, no args). The vendor PDF
 * documents SET/sub-forms (`server`/`inquire`/`show`/`wan`/`zone`/`pseudo`);
 * this operation only models the live-observed bare query. Output is
 * free-form -- return the trimmed raw text (YAGNI).
 */

export interface SysTime {
  readonly raw: string;
}

export function parseSysTime(text: string): SysTime {
  return { raw: text.trim() };
}
