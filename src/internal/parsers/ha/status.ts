/**
 * Pure pass-through parser for `ha status -a <Detail Level>` / `ha status
 * -m <Detail Level>` (`cli.ha.status`, rawLine 12373, classification
 * "read").
 *
 * The heading documents three distinct detail levels (0/1/2, each adding
 * more fields -- basic info, then firmware/model/HTTPS-port/MAC, then HA
 * settings) across two scopes (`-a` all routers in the HA group, `-m` local
 * router only) -- six effectively-distinct output shapes. Structuring all of
 * them now would be speculative (YAGNI), same reasoning as
 * `internal/parsers/sys/health.ts`'s eight distinct metric tables. This
 * returns the trimmed raw text, a real (if minimal) transform.
 */

export interface HaStatus {
  readonly raw: string;
}

export function parseHaStatus(text: string): HaStatus {
  return { raw: text.trim() };
}
