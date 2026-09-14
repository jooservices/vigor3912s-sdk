/**
 * Pure pass-through parser for `ha show -c` / `ha show -g` (`cli.ha.show`,
 * rawLine 12336, classification "read").
 *
 * The heading's two documented variants have distinct, differently-shaped
 * outputs (`-c`: config-sync settings; `-g`: general-setup settings plus a
 * per-LAN virtual-IP table shown to LAN100+ in the sample) -- structuring
 * both shapes into one DTO now would be speculative (YAGNI), same reasoning
 * as `internal/parsers/sys/health.ts` for its eight distinct metric tables.
 * This returns the trimmed raw text, a real (if minimal) transform.
 */

export interface HaShow {
  readonly raw: string;
}

export function parseHaShow(text: string): HaShow {
  return { raw: text.trim() };
}
