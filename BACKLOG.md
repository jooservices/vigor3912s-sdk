# Vigor3912S SDK — Implementation Backlog

**Status:** Approved by user 2026-09-13. Single planning pass per `ARCHITECTURE.md`'s gate note — no second `joo-team-lead` run for this scope. Produced by `joo-team-lead` (Sonnet) from `ARCHITECTURE.md` / historical planning notes + `ARCHITECTURE.md` + current source.

**Completion push (2026-09-13, root + joo-dev/reviewer/qa):** User directed 100% CLI command support. Outcome (verify green): **472 CLI ops implemented / 6 blocked-by-documentation / 0 documented remaining**; **24** `live-firmware-recon` additive entries implemented; **2114** tests. This is a historical CLI-completeness snapshot; the current SDK verification snapshot is below. Optional leftovers are enrichment/WebUI/live-E2E only — not missing CLI coverage.

**SDK transport completion (2026-09-14, root verified):** REQ-SDK-1 through REQ-SDK-6 are complete. Current `npm run verify` is green: **494 test files / 2346 tests**, `manifest:check` covers **649 entries** (478 CLI + 171 WebUI), **472 operations / 42 domain modules**, and global coverage thresholds in `vitest.config.ts` are satisfied (statements **99.59%**, branches **94.28%**, functions **99.94%**, lines **99.59%**). `npm audit --audit-level=moderate` reports **0 vulnerabilities**. Independent container QA in `node:24.21.0-bookworm` with npm 12.0.2 passed: `npm ci`, `npm run verify`, `npm pack --dry-run`, and installed consumer smoke.

**Standard verification gate** (every task, unless noted): per `ARCHITECTURE.md` / historical planning notes "Quality commands". As of 2026-09-13, run natively on host: `nvm use` from `sdk/` (picks up `.nvmrc` -> Node 24.21.0; `npm install -g npm@12.0.2` once if needed) — no Docker required day-to-day, since `sdk/` sits at its real path in the workspace and the manifest generator's cross-boundary read to `.ai/skills/vigor3912s/references/cli-reference-raw.txt` resolves correctly natively. The earlier Docker pattern (mounting `sdk/` read-only into `node:24.21.0-bookworm`, npm 12.0.2 installed only inside the container, `.env` never mounted, no E2E) remains an acceptable fallback if `nvm` is unavailable — in that case mount/copy the surrounding workspace (`.ai/`, `projects/vigor3912s/webui-capture/`, `sdk/`) preserving relative depth, not just `sdk/` alone.

```
nvm use && npm ci && npm run format:check && npm run lint && npm run typecheck && npm test && npm run build && npm run verify
```

Add `npm audit --audit-level=moderate` when a task adds/updates a dependency. Add `npm run manifest:generate` / `npm run manifest:check` where a task states so.

DoD floor for every task: standard gate green; no new lint/typecheck suppressions; no `.env`/live/SSH/destructive-command code path introduced; existing Task 1-3 tests keep passing unmodified in behavior; reviewer + QA accept per `.ai/guides/subagent-delivery.md` phase gates.

Traceability legend: `ARCH#Item-N` = `ARCHITECTURE.md` section; `ARCH#RDL-x` = a row in its resolved-decisions log; `ARCH#...` = the referenced ARCHITECTURE.md content.

---

> **Archive note for Waves 1-4:** The Wave 1 through Wave 4 sections below
> preserve historical planning and progress snapshots from earlier delivery
> dates. Any present-tense task-state language in those archived sections
> (`not started`, `pending`, `continuing`, or similar) is superseded by the
> current completion summary at the top of this file and the completed Wave 5
> section. Treat Waves 1-4 as traceability history only, not current work
> instructions.
>
> **Superseded 2026-09-14:** B2 `ChangePlan` / `denyAllVerifier` / typed-write
> executor path was **removed**. Typed writes use `invoke()`; see
> `ARCHITECTURE.md` Item 2 amendment. Historical B2 text below is archive only.

## Wave 1 — two parallel lanes (zero file overlap)

**Status: A1 and C1 accepted 2026-09-13** (dev → review → qa all green, full verify passes, zero must-fix findings, no regression). A2-A4, C2-C7 not started.

### Lane A — Item 1: capability manifest (sequential A1→A4)

**A1 — Manifest schema types** ✅ accepted
Add `src/manifest/types.ts`: `CapabilityEntryBase`, `CliCapabilityEntry`, `WebUiCapabilityEntry`, `CapabilityEntry`, `Citation`, `Classification`, `ClassificationBasis`, `CapabilityStatus` exactly per `ARCH#Item-1`. Type-only, no data. Files: `src/manifest/types.ts` (new). Prereqs: none. DoD: types match architecture verbatim, `tsc --noEmit` clean. Traces: `ARCH#Item-1`.

**A2 — CLI corpus generator + classification**
`tools/generate-capability-manifest.ts` (CLI portion): parse `.ai/skills/vigor3912s/references/cli-reference-raw.txt` directly into `CliCapabilityEntry[]`, one per of the 327 headings — handle the indented `wan vlan` heading (line 11191) correctly (naive `^`-anchored regex undercounts to 326). Apply the danger-list overlay (`sys cfg default`, `sys reboot`, `mngt rmtcfg enable`, `linux clean -w/-o` → `classification: "destructive"`, `status: "documented"` (accurate metadata only — the SDK does not exclude/block anything; see `ARCHITECTURE.md`'s 2026-09-13 amendment), basis `"operations-danger-list"`). Apply the streaming block for `log -wt`-style commands → `status: "blocked-by-documentation"` with a `blockedReason`. Classification for other commands comes from a **hand-maintained lookup table embedded in the generator tool** cross-referencing `command-map.md`'s existing categorized tables (tagged `classificationBasis: "command-map-family"`) — never inferred from the command string; unmatched commands stay `"unknown"`/`"unclassified"`. Files: `tools/generate-capability-manifest.ts` (new). Prereqs: A1. DoD: 327 unique CLI entries in-memory, all cited/classified/statused, danger-list + streaming block correct. Traces: `ARCH#Item-1`, `ARCH#RDL` (streaming row).

**A3 — WebUI corpus ingestion + generated artifact + npm script**
Extend the generator to parse `projects/vigor3912s/webui-capture/INDEX.md`'s 171-row table into `WebUiCapabilityEntry[]` (citation = `{captureFile, indexRow}`, never content), **excluding AppleDouble `._*` sidecar files** from any scan (confirmed present in `webui-capture/text/`). Merge CLI+WebUI into one array, write `src/manifest/capability-manifest.generated.ts` as `export const capabilityManifest = [...] as const satisfies readonly CapabilityEntry[]`. Mark WebUI-only functions (config backup, firmware upgrade, port knocking, Fast NAT) `blocked-by-documentation` with a real reason. Add `npm run manifest:generate` script (manual tool, not part of `test`/`verify`). Files: `tools/generate-capability-manifest.ts` (extend), `src/manifest/capability-manifest.generated.ts` (new, generated), `package.json` (+1 script line — only edit to this shared file in Lane A so far). Prereqs: A1, A2. DoD: generated file compiles under `satisfies`; 327+171=498 entries, no duplicate ids, no capture content embedded. Traces: `ARCH#Item-1`, `ARCH#RDL-Q5`, `ARCH#RDL-Q6`.

**A4 — Census tests + typed accessors + `manifest:check`**
`src/manifest/index.ts` (typed accessors: `byId`, `byClassification`, `counts`). `tests/manifest/census.test.ts`: exactly 327 `cli-command` + 171 `webui-page`; unique ids; citation+status on every entry; `blockedReason` iff `blocked-by-documentation`; `wan vlan` present; no phantom AppleDouble-derived entry. Add `npm run manifest:check` (regenerate to temp path, diff, non-zero exit on drift) folded into `npm run verify`. Files: `src/manifest/index.ts` (new), `tests/manifest/census.test.ts` (new), `package.json` (+`manifest:check` script + extend `verify` — 2nd/last edit to this file in Lane A), `tools/generate-capability-manifest.ts` (+`--check` mode). Prereqs: A3. DoD: census green; `verify` fails on drift. Traces: `ARCH#Item-1`.

### Lane C — Item 3: execution primitives (sequential C1→C7, no file overlap with Lane A)

**C1 — Extend error codes** ✅ accepted: add `command_framing_rejected`, `execution_timeout`, `output_limit_exceeded`, `session_closed`, `change_plan_unverified`, `live_client_rejected` to the existing `sdkErrorCodes` object. File: `src/errors.ts`. Prereqs: none. Traces: `ARCH#Item-3`.

**C2 — Command framing**: `internal/execution/framing.ts`, `frameSingleCommand(input): CommandFrame` (branded/unforgeable). Rejects LF/CR, C0/C1 control chars, `;`, `&`, `|`, backtick, `$(`, empty/whitespace. Carve-out: bare `?` and `<cmd> ?` allowed, named test. Files: `internal/execution/framing.ts`, `tests/execution/framing.test.ts`. Prereqs: C1. Traces: `ARCH#Item-3`, `ARCH#RDL-Q7`.

**C3 — Execution limits**: `internal/execution/limits.ts`, `ExecutionLimits` with final numbers (`maxCommandBytes: 1024`, `commandTimeoutMs: 15_000`, `idleTimeoutMs: 5_000`, `maxOutputBytes: 4 MiB`); `resolveLimits(defaults, options)` — caller may only lower `commandTimeoutMs`, never raise. Files: `internal/execution/limits.ts`, `tests/execution/limits.test.ts`. Prereqs: C1. Traces: `ARCH#Item-3`.

**C4 — Transport port + fake-transport support**: `internal/execution/transport.ts` (`Transport` interface: `isOpen`, `send(frame, limits, signal)`, `close(reason)`, plus `CommandExchange`/`TransportExchange`). `tests/support/fake-transport.ts` shared fake for all later tests. Prereqs: C2, C3. Traces: `ARCH#Item-3`.

**C5 — SessionQueue**: `internal/execution/session-queue.ts`, FIFO promise-chain, concurrency 1, `AbortSignal` support, closed-session rejects immediately. No mutex dependency. Prereqs: C4. Traces: `ARCH#Item-3`.

**C6 — DefaultCommandRunner**: `internal/execution/default-runner.ts` implements the unchanged `CommandRunner` interface (Task 2) composing framing+limits+queue+transport. Includes the `ip ping`/`ip tracert` diagnostic exception: registry-defined `executionOverride` ceiling (60s), never a caller-supplied option. Overflow on `maxOutputBytes` throws and closes — never truncates. Prereqs: C2-C5. Traces: `ARCH#Item-2`, `ARCH#Item-3`.

**C7 — No-logging test + scoped ESLint rule**: `tests/execution/no-output-leak.test.ts` drives a canary string through the composed runner, asserts it never leaks into any error's message/cause/serialization. Scoped `no-console` ESLint rule for `internal/execution/**`. Prereqs: C1-C6. Traces: `ARCH#Item-3`.

**Wave 1 proof of non-overlap:** Lane A = `src/manifest/**`, `tools/generate-capability-manifest.ts`, `tests/manifest/**`, 2 lines in `package.json`. Lane C = `src/errors.ts`, `internal/execution/**`, `tests/execution/**`, `tests/support/fake-transport.ts`, 1 block in `eslint.config.js`. **Zero shared files — run A and C as two parallel `joo-dev` tracks.**

---

## Wave 2 — three parallel tracks (depends on Wave 1 complete)

**Status: B1, B2, D accepted 2026-09-13** (dev → review → qa all green, 47/47 tests, zero must-fix findings). Scope of all three was narrowed at implementation time vs. the literal text below, since Lane A (A2-A4) and Lane C (C2-C7) haven't run yet: B1 defers `registry.generated.ts`/generator-tool wiring; B2 uses a temporary `ChangePlanFrame = string` placeholder for `frames`; D uses a temporary local `RawTransport` interface instead of the real `Transport`/`DefaultCommandRunner`. All three are documented with `// TODO` markers for Lane C to replace. Follow-up note: consider consolidating D's `RawTransport` with the existing internal `CommandRunner` shape when Lane C lands (reviewer's informational note, not a blocker).

**B1 — OperationRegistry + self-assembling aggregator** ✅ accepted (scope narrowed, see status note above). **Follow-up completed 2026-09-13** (prerequisite for Wave 4 parallelism): `src/internal/registry/self-assembly.ts` + `src/internal/registry/registry.generated.ts` — `tools/generate-capability-manifest.ts` now discovers `src/domains/*.ts` (export convention: `export const operations: readonly TypedOperation<never, unknown>[]`), self-assembles the registry, and overlays `status: "implemented"`/`operationIds` onto the manifest, all via `npm run manifest:generate`. Review caught and root fixed a real bug: deleting a domain file used to brick the whole build (stale `registry.generated.ts` import + `manifest:generate`/`check` depending on a full `npm run build`) — fixed by adding `tsconfig.generator.json` (a narrow build excluding `src/domains/**` and both `*.generated.ts` outputs) so `manifest:generate`/`manifest:check` no longer depend on a full project build succeeding. Verified self-healing: add domain → generate → delete domain → generate again → clean 517/0 baseline, no manual recovery needed.
`internal/registry/operation.ts` (`TypedOperation<TInput, TOutput>` descriptor), `internal/registry/registry.ts` (frozen `ReadonlyMap`). Two invariant tests (registry keys exist in manifest — any classification, including `destructive`, is a valid registry entry per the 2026-09-13 amendment; every `implemented` manifest entry has ≥1 registry entry) — vacuously true while empty. **Refinement (confirms `ARCH#Item-5`'s self-assembly recommendation):** extend the generator tool to `readdir` `src/domains/*.ts` and emit `internal/registry/registry.generated.ts` (generated aggregator, mirrors the manifest-generated pattern) plus overlay `status: "implemented"`/`operationIds` back onto the manifest — so adding a domain in Item 5 touches **zero shared hand-maintained files**, only `npm run manifest:generate` (already gated by `manifest:check`). Files: `internal/registry/operation.ts`, `internal/registry/registry.ts`, `internal/registry/registry.generated.ts` (new, generated, empty initially), `tools/generate-capability-manifest.ts` (extend — sequential-after-Lane-A edit, not concurrent), `tests/registry/invariants.test.ts`. Prereqs: Wave 1 complete. Traces: `ARCH#Item-2`, `ARCH#Item-5`.

**B2 — ChangePlan / VerifiedChangePlan / ChangePlanVerifier / denyAllVerifier** ✅ accepted (scope narrowed, see status note above)
`internal/change-plan/change-plan.ts` (`ChangePlan`, unforgeable `VerifiedChangePlan` via private brand symbol), `internal/change-plan/verifier.ts` (`ChangePlanVerifier` + `denyAllVerifier` default that always rejects). `TypedWriteExecutor.execute(plan: VerifiedChangePlan)` is the only write path. Tests prove unforgeability, `denyAllVerifier` always rejects, raw `execute()` never routes through `ChangePlan`. Files: `internal/change-plan/**`, `tests/change-plan/**`. Prereqs: Wave 1 Lane C. Traces: `ARCH#Item-2`.

**D — Raw `execute()` wiring on `Vigor3912SClient`** ✅ accepted (scope narrowed, see status note above)
`Vigor3912SClient` gets an optional constructor param for `Transport` injection (default: none → still `OperationNotImplementedError`, preserving existing Task 2 zero-arg tests byte-for-byte). When injected, `execute(command, options?)` dispatches through `DefaultCommandRunner`. `CommandResult` drops `exitCode` (per `ARCH#RDL` B1 — no fabricated exit codes). Existing tests extended additively, not altered. Files: `src/client.ts`, `src/index.ts`, `tests/index.test.ts` (extend), `tests/package-entrypoint.test.js` (extend), `tests/execution/raw-execute-dispatch.test.ts` (new). Prereqs: Wave 1 Lane C. Traces: `ARCH#Item-3`.

**Wave 2 proof:** B1, B2, D touch disjoint file sets (B1's edit to the generator tool is sequential-after-Lane-A, not concurrent with Wave 2 peers). **Run B1, B2, D as three parallel `joo-dev` tracks.**

---

## Wave 3 — Item 4: transport/session policy + `LiveReadOnlyClient` (sequential, safety-critical, not parallelized)

**Status: E1 accepted 2026-09-13.** Architecture Amendment 2026-09-13 also accepted in between (dev → review → qa all green): removed the `excluded-by-safety` exclusion mechanism, split `sys cfg`/`mngt rmtcfg`/`linux` headings into 22 per-command entries (346 cli-command total, up from 327; manifest is now 517 entries). See `ARCHITECTURE.md`'s amendment note. `linux status` is now correctly classifiable as `read` for E2 below (previously would have been wrongly excluded).

**E1 — Declarative policy types** ✅ accepted: `src/live/policy.ts` — `TransportPolicy` (`allowedHostKinds: readonly ["private-lan"]`, `port`, `connectTimeoutMs`, `allowAgentForwarding: false`), `SessionPolicy` (`maxConcurrentCommands: 1`, `idleTimeoutMs`, `maxSessionMs`), unsafe values unrepresentable via literal types. Prereqs: Wave 1 Lane C. Traces: `ARCH#Item-4`.

**E2 — `liveReadOnlyAllowlist`** ✅ accepted (14 ids incl. `wan status`, fixed after transcription gap): `src/live/allowlist.ts`, seeded from `ARCH#Item-4`'s candidate list (`sys version, show status, show lan, show dmz, show dns, show nat, show portmap, show session, show traffic, show clienttraffic, show statistic, sys health, linux status`), mapped to manifest ids. Test: every allowlist id exists in the manifest with `classification: "read"`. Prereqs: Wave 1 Lane A, E1. Traces: `ARCH#Item-4`.

**E3 — `LiveReadOnlyClient` + pre-connect guard chain** ✅ accepted (2 review passes — first flagged missing `status: "implemented"` check in guard 2, fixed, re-reviewed clean, QA independently confirmed all 4 guards with own fixtures): `src/live/live-read-only-client.ts`, surface = `Pick<ReadOperationsMap, LiveReadOnlyId>` (near-empty until Item 5). Guard order: (1) `VIGOR_E2E_READ_ONLY === "true"` exactly; (2) requested ids in allowlist + `classification: "read"`; (3) transport policy host check; (4) no write/destructive/raw capability reachable. Any failure throws `LiveClientRejectedError` **before** `transport.connect` — proven via fake transport + spy. Add `package.json` `exports["./live"]`. **Explicit stop: no real connection, no E2E, no `.env` read in this task** — needs separate explicit user authorization later. Files: `src/live/live-read-only-client.ts`, `tests/live/live-read-only-client.test.ts`, `package.json` (+`exports["./live"]`). Prereqs: E1, E2, Wave 2 B1. Traces: `ARCH#Item-4`, `HANDOVER` safety boundary.

---

## Gate F0 — Coverage tooling (sequential, before Wave 4)

**Status: accepted 2026-09-13** (2 review passes — first flagged `vitest.config.ts` missing from strict typecheck/lint scope; fixing that surfaced a real upstream `vite@8.3.0`/`vitest@5.0.0` type-declaration bug (3 independent breakages, confirmed both are already at latest), worked around by dropping the `defineConfig` import for a plain object literal, which is a proven runtime no-op-equivalent; QA independently reproduced everything). 18 test files / 156 tests, coverage wired (95.16% stmts), no threshold enforced.

Resolve and pin the exact stable version of `@vitest/coverage-v8` from the official npm registry (compatible with pinned Vitest 5.0.0), add `vitest.config.ts`, wire coverage into `verify`, document the resolved version in `README.md`'s tooling table (same pattern as Task 1). Files: `package.json`, `package-lock.json`, `vitest.config.ts` (new), `README.md`. Prereqs: Waves 1-3 complete. Validation: standard gate + `npm audit --audit-level=moderate`. Traces: `ARCH#Item-5`, `ARCH#RDL-Q4`.

---

## Wave 4 — Item 5: incremental domain modules (deterministic expansion rule, no new planning pass needed)

**Status: 8-family batch accepted 2026-09-13** (`msubnet`, `srv`, `swm`, `vlan`, `csm`, `switch`, `vigbrg`, `ddns` — 72 operations, dev → review → QA all green, independently re-verified). `srv`'s self-flagged LAN-scope discrepancy vs. `vigor3912s-mcp` for `gateway`/`startip`/`leasetime` (firmware/doc-generation drift, not a defect) — tracked as a follow-up note, same treatment as the `ip.arp`/`wan.detect` split. **Status: second batch accepted 2026-09-13** (`vpn`, `ipf`, `hsportal`, `ldap`, `ha`, `tacacsplus`, `upnp`, `qos`, `object`/`usb`/`apm`, `testmail`/`local_8021x`/`wol`/`user`/`nand`/`service` — 35 operations, dev → review → QA all green, independently re-verified from a clean install). Combined Wave 4 state: **1031/1031 tests, 202 operations across 32 domain modules**, 517 manifest entries unchanged. `vigor3912s-mcp` sibling-evidence cross-referencing is now exhausted — remaining unimplemented entries need raw-text-only classification research (no more free sibling-verified wins). User directive: fully complete every command, nothing deferred except genuinely unclassifiable "unknown" entries.

**Status: `vigor3912s-mcp` cross-reference classification correction accepted 2026-09-13** (dev → 2 review passes → QA all green, 587/587 tests; 88 entries now `classificationBasis: "sibling-live-verified"` (79 previously-unknown resolved + 9 mismatches corrected)). User directive: fully complete every command, nothing deferred. Continuing to remaining tiers now.

**Tracked follow-up (root audit, 2026-09-13, review-flagged, not blocking):** `cli.ip.arp`, `cli.ip.route`, `cli.ip.session`, `cli.wan.detect` are each a single manifest entry now blanket-labeled `classification: "read"` after the `vigor3912s-mcp` cross-reference, but the underlying heading also documents real mutating sub-forms (`ip arp add/del/flush/...`, `ip route add/del/default/clean`, `ip session on/off/add/del/...`, `wan detect <wan> on/off/strict/always_on`) that have no manifest representation today — `src/domains/ip.ts`/`wan.ts` narrowed each `TypedOperation`'s input to only the read sub-forms (explicit code comments, test-guarded, not silently dropped). Same class of problem as the `sys cfg`/`mngt rmtcfg`/`linux` split in the 2026-09-13 amendment; recommend eventually splitting these 4 headings into separate read/write manifest entries the same way, so the write sub-forms get their own accurately-classified ids instead of remaining permanently unrepresented. Not a safety issue (`denyAllVerifier` gates all writes regardless of manifest shape); a coverage-completeness item for a future Wave 4 pass.

**Status: P1 tier fully accepted 2026-09-13** (dev → review → QA all green, independently re-verified twice — 4 parallel `joo-dev` tracks — `show`, `sys`, `wan`, `linux` — dev complete, review/QA pending). 61 operations implemented across 4 domain modules (346 total `cli-command` entries in the manifest, 40 families total). Deferred entries (`unknown` classification, left unimplemented per YAGNI): 17 in `sys`, 3 in `wan`, 2 in `linux`. Two shared-infrastructure bugs found and fixed during this wave: (1) `discoverDomainOperations` importing raw `src/domains/*.ts` broke for any domain with a real runtime import — fixed by widening `tsconfig.generator.json` to compile `src/domains/**` too and importing from `dist/domains/*.js` at generation time (`self-assembly.ts`'s `importDir` param). (2) `tests/manifest/census.test.ts` wrongly asserted danger-list commands stay `status: "documented"` forever — fixed to allow `"implemented"` once a family legitimately implements one (accurate per the amendment: destructive is metadata, not exclusion). Both fixes verified via full `npm run verify` (80 files / 425 tests green). All 4 families independently converged on mapping `TypedOperation.classification: "destructive"` → `"write"` (the type only has `"read"|"write"`, predates the amendment) while leaving the manifest's own `classification: "destructive"` untouched and authoritative — noted as a real gap to close before P3 tier (widen `OperationClassification` to include `"destructive"`).

**Expansion rule the root applies mechanically once the manifest exists:**

1. **Partition**: every `capabilityManifest` entry with `kind: "cli-command"` and `status: "documented"`, grouped by `commandPath[0]` (never by `command-map.md` prose directly).
2. **One `joo-dev` task per family** (`Item5-<family>: implement <commandPath[0]> operations`). No task for an empty group.
3. **Classification sub-step** (mechanical, inside the task): any `"unknown"`-classified target entry gets classified from direct vendor-doc evidence (`classificationBasis: "documented-syntax"`), added to the generator's lookup table, then `npm run manifest:generate` re-run before writing domain code.
4. **Priority tiers** (deterministic, no new judgment calls):
   - **P1** — families containing ≥1 `liveReadOnlyAllowlist` id (`sys`, `show`, `wan`, `linux` first) — lowest risk, no `ChangePlan` involved.
   - **P2** — remaining `read`-classified families, ordered by descending `documented`-entry count, then alphabetically.
   - **P3** — `write`- and `destructive`-classified families, same ordering — exercises the `denyAllVerifier`-gated path (still fully testable via fake transport; nothing executes against a real router regardless of classification until a real verifier is configured).
   - **P4** — `interactive`/mixed families needing case-by-case design — deferred with a one-line note per family, not silently dropped.
5. **Per-family task template**: `src/domains/<family>.ts` (one `defineOperation({manifestId, classification, buildFrames, parse})` per entry), `internal/parsers/<family>/<op>.ts` (pure parsers). Fixed four-test convention per operation in `tests/domains/<family>/<op>.test.ts`: (1) frame construction incl. rejections, (2) parser against a redacted fixture (via the Task 3 importer — synthetic sample text where no real capture exists yet, consistent with Task 3's synthetic-only precedent), (3) manifest linkage, (4) limits/failure via fake transport. Ends with `npm run manifest:generate && npm run manifest:check`.

**Wave 4 parallelism**: each family's write scope (`src/domains/<family>.ts`, `internal/parsers/<family>/*`, `tests/domains/<family>/*`, its own new fixtures) never overlaps another family's, and the registry self-assembles (B1) rather than being hand-edited — **multiple `joo-dev` agents may run one family each in parallel, within the same tier**, with the root serializing only the `manifest:generate`/`manifest:check` regeneration step across merges within a tier before opening the next tier.

---

## Write-scope / parallelism summary

| Wave | Parallel tracks                              | Depends on          |
| ---- | -------------------------------------------- | ------------------- |
| 1    | Lane A (A1-A4) ‖ Lane C (C1-C7)              | —                   |
| 2    | B1 ‖ B2 ‖ D                                  | Wave 1              |
| 3    | E1 → E2 → E3 (sequential)                    | Wave 1, Wave 2 (B1) |
| Gate | F0 (sequential)                              | Wave 1-3            |
| 4    | One track per family, fanned out P1→P2→P3→P4 | Gate F0             |

## Three implementation-detail refinements flagged for a quick nod (not blockers, not re-opened architecture)

1. **A2** — manifest classification is sourced via a hand-maintained lookup table embedded in the generator tool (cross-referencing `command-map.md`), not inference from command text.
2. **B1** — registry self-assembly is concretized as a second generated aggregator (`registry.generated.ts`) produced by the same generator tool reading `src/domains/*.ts` — this is what makes Wave 4 truly parallel with zero shared hand-edited files.
3. **D** — `Vigor3912SClient` gets an optional constructor param for `Transport` injection; default (no arg) preserves every existing Task 1-3 test verbatim.

## Historical initial next gate

At the initial 2026-09-13 planning gate, the next recommended step was Wave 1 implementation: `joo-dev` on **A1** (manifest types) and a second `joo-dev` on **C1** (error codes), in parallel. This is retained only as planning history; the current state is the completed Wave 5 status below.

---

## Wave 5 — Public client `Transport` seam (user 2026-09-14)

**Status: complete 2026-09-14.** Architecture amendment 2026-09-14 + `ARCHITECTURE.md` / historical planning notes §6a–§6b. CLI domain coverage (Wave 4) remains complete; this wave finished the **client-facing transport contract** and passed independent container QA.

**T5.1/T5.3/T5.5 accepted 2026-09-14** (dev green, 493 files / 2120 tests, build emits `dist/transport/{index.d.ts,index.js}`, `manifest:check` unaffected). `src/transport/index.ts` re-exports `Transport`/`CommandExchange`/`TransportExchange`/`CommandFrame` on `package.json` `exports["./transport"]`; `Vigor3912SClient.fromTransport(transport)` added additively (zero-arg/`CommandRunner`-arg behavior unchanged); transport error codes (`sessionClosed`, `executionTimeout`, `outputLimitExceeded`) confirmed already public + asserted against real failure paths. No SSH, no import of `vigor3912s-client`. T5.2/T5.4/T5.6 were still tracked separately at that snapshot and are closed below.

**T5.2/T5.4/T5.6 accepted 2026-09-14** (root verified via final `npm run verify`): `docs/transport.md` documents public implementor semantics, `ExecutionLimits`, `AbortSignal`, close/open behavior, no fabricated exit codes, output limits, timeout expectations, and DrayOS prompt/pager responsibilities; `FakeTransport` is documented as the reference test fixture, not production wire; README and `sdkMetadata.status` now state typed SDK operations plus public transport injection, with no SSH/live transport in this package.

**Read-only safety remediation accepted 2026-09-14:** `LiveReadOnlyClient` now uses the canonical manifest/registry instead of caller-supplied fake operation metadata, and dispatches via the bounded runner. Reviewer findings F-1, F-3, and F-4 are verified fixed. F-2 remains an explicit cooperative-timeout risk: `Transport` implementors **must** honor `AbortSignal`.

**Non-goals:** no `ssh2` / live connect; **no MCP requirements or adapters** in this package.

| Task     | REQ       | Scope                                                                                                     | Result                                                         |
| -------- | --------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **T5.1** | REQ-SDK-1 | Public `./transport` export (`Transport`, exchange types, frame type as needed); `package.json` `exports` | ✅ Complete — importable without `internal/`; build emits d.ts |
| **T5.2** | REQ-SDK-2 | `docs/transport.md` (+ JSDoc) for client implementors                                                     | ✅ Complete — doc merged and linked from README                |
| **T5.3** | REQ-SDK-3 | Documented + tested public `Transport` injection                                                          | ✅ Complete — `FakeTransport` round-trip via public API        |
| **T5.4** | REQ-SDK-4 | Clarify FakeTransport as reference impl                                                                   | ✅ Complete — documented as test/reference only                |
| **T5.5** | REQ-SDK-5 | Stable transport-related error codes                                                                      | ✅ Complete — exported + tested                                |
| **T5.6** | REQ-SDK-6 | README + `sdkMetadata.status` honesty (no SSH in SDK; client implements `Transport`)                      | ✅ Complete — docs match §4 / §6a                              |

**Final SDK evidence:** `npm run verify` green (494 test files / 2346 tests), `manifest:check` green (649 entries), coverage thresholds green, `npm audit --audit-level=moderate` clean, container `npm ci` + `npm run verify` green, `npm pack --dry-run` green, and installed consumer smoke green.

**Downstream (other package):** client implements `Transport` (e.g. SSH).
