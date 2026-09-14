/**
 * Hand-maintained live read-only allowlist.
 *
 * Per `ARCHITECTURE.md`'s "Item 4 — transport/session policy and
 * `LiveReadOnlyClient`": two independent keys gate every live-callable
 * operation — (a) its manifest entry has `classification: "read"` and
 * `status: "implemented"`, and (b) its id appears here. This file is the
 * hand-maintained half of that gate: a generated manifest alone can never
 * widen live reach, and a human edit alone (this file) can never bypass the
 * manifest — `tests/live/allowlist.test.ts` cross-checks every id below
 * against the generated manifest's `classification`.
 *
 * Seeded from `ARCHITECTURE.md` Item 4's candidate list (sourced from
 * `command-map.md`'s "Status & diagnostics (read-only, safe)" table), mapped
 * to the real generated manifest ids (`src/manifest/capability-manifest.generated.ts`)
 * by exact `command` string match — never guessed:
 *
 * | candidate command    | manifest id             | classification |
 * | --------------------- | ------------------------ | --------------- |
 * | sys version            | cli.sys.version          | read            |
 * | wan status             | cli.wan.status           | read            |
 * | show status            | cli.show.status          | read            |
 * | show lan               | cli.show.lan             | read            |
 * | show dmz               | cli.show.dmz             | read            |
 * | show dns               | cli.show.dns             | read            |
 * | show nat               | cli.show.nat             | read            |
 * | show portmap           | cli.show.portmap         | read            |
 * | show session           | cli.show.session         | read            |
 * | show traffic           | cli.show.traffic         | read            |
 * | show clienttraffic     | cli.show.clienttraffic   | read            |
 * | show statistic         | cli.show.statistic       | read            |
 * | sys health             | cli.sys.health           | read            |
 * | linux status           | cli.linux.status         | read            |
 *
 * All 14 candidates were found in the generated manifest under an exact
 * `command` match, and all are `classification: "read"` — no discrepancy to
 * report for this seed set. (`wan status` was in ARCHITECTURE.md's candidate
 * list but initially dropped from BACKLOG.md's E2 transcription; added back
 * here after the E2 developer flagged the mismatch.)
 *
 * This constant is unused until Item 4's guard chain (`LiveReadOnlyClient`,
 * Wave 3 E3) has tests **and** the user gives separate, explicit
 * authorization for any live connection. Listing an id here is not a green
 * light to connect.
 */

export const liveReadOnlyAllowlist: readonly string[] = [
  "cli.sys.version",
  "cli.wan.status",
  "cli.show.status",
  "cli.show.lan",
  "cli.show.dmz",
  "cli.show.dns",
  "cli.show.nat",
  "cli.show.portmap",
  "cli.show.session",
  "cli.show.traffic",
  "cli.show.clienttraffic",
  "cli.show.statistic",
  "cli.sys.health",
  "cli.linux.status",
];
