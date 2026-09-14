/**
 * Pure parser for `sys pollbuf` (`cli.sys.pollbuf`, classification "read").
 *
 * Sibling-live-verified bare/query form (`sys pollbuf`, no args). The vendor
 * PDF documents only the SET forms (`sys pollbuf on|off`); the bare query is
 * live-observed. Output shape is free-form acknowledgement text -- return the
 * trimmed raw text rather than inventing structure (YAGNI).
 */

export interface SysPollbuf {
  readonly raw: string;
}

export function parseSysPollbuf(text: string): SysPollbuf {
  return { raw: text.trim() };
}
