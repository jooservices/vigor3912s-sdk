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
 * | show statistic         | cli.show.statistic       | read            |
 * | linux status           | cli.linux.status         | read            |
 *
 * The 11 listed ids are `classification: "read"` under an exact `command`
 * match. The client's `invoke(id)` takes no input, so parameterized traffic
 * reads stay out of this list until JOODT-33 adds safe input support. `sys
 * health` also remains omitted because it requires a metric argument.
 *
 * Listing an id here is not authorization to connect to a live router;
 * that still needs separate, explicit owner approval.
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
  "cli.show.statistic",
  "cli.linux.status",
];
