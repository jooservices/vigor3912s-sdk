/**
 * Pure pass-through/ack-style parser for `ha set [-<command> <parameter>|
 * ...]` (`cli.ha.set`, rawLine 12262, classification "write").
 *
 * The heading documents a flag-combination command (17 independent flags,
 * `-e`/`-l`/`-M`/`-v`/`-R`/`-p`/`-k`/`-u`/`-m`/`-s`/`-y`/`-c`/`-C`/`-I`/`-h`/
 * `-d`/`-o`) whose only documented sample output is a short acknowledgement
 * / settings-echo block (e.g. "% Enable IPv4 Virtual IP on LAN1"), never a
 * single fixed structured table -- mirrors `internal/parsers/mngt/ack.ts`'s
 * and `internal/parsers/sys/health.ts`'s identical reasoning for the same
 * documented shape (a real, if minimal, transform; not an implementation
 * shortcut).
 */

export interface HaSetAck {
  readonly raw: string;
}

export function parseHaSet(text: string): HaSetAck {
  return { raw: text.trim() };
}
