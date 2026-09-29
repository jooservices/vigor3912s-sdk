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
 * | linux status           | cli.linux.status         | read            |
 *
 * All 13 are `classification: "read"` under an exact `command` match. The
 * client's `invoke(id)` takes no input, so every id here must be input-less:
 * `sys health` was dropped because it requires a metric argument.
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
  "cli.show.traffic",
  "cli.show.clienttraffic",
  "cli.show.statistic",
  "cli.linux.status",
];
