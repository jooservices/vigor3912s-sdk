# Vigor3912S SDK — Approved Architecture

**Status:** Approved by user 2026-09-13. Covers `HANDOVER.md` → "Next implementation sequence" items 1-5.
**Gate:** Architecture phase closed. Do not re-run `joo-sa` for this scope; amend this file directly (with root + user sign-off) if a genuine new architectural question appears during implementation. Planning (`joo-team-lead`) must produce one complete backlog from this document — no second planning pass.

**Amendment 2026-09-13 (root + user sign-off, discovered mid-Lane-A):** Two changes to Item 1, made after the first Lane A pass (A2-A4) revealed that `cli-reference-raw.txt` headings are coarser than real documented commands (one heading, e.g. "linux", can cover several distinct sub-commands spanning multiple safety classifications — see the corrected Item 1 text below). Cross-checked against the sibling `projects/vigor3912s-mcp` project, which already solved this exact problem live against the real router (217 commands / 42 families / 108 read + 109 write, fw 4.4.7_RC2) — its `src/commands/registry/families/*.ts` is one command per registry row, not one row per documentation heading, which is the corrected model adopted here.

**Amendment 2026-09-13 (root + user sign-off, 100%-command completion):** Add a third `Citation` corpus variant for CLI commands that exist on live firmware **4.4.7_RC2** (device recon) but are **absent from the User Guide Part VIII PDF corpus** (and therefore cannot cite `rawLine`/`pdfPage`). Shape: `{ corpus: "live-firmware-recon"; firmware: "4.4.7_RC2"; evidenceRef: string }` where `evidenceRef` is a **location pointer only** (e.g. sibling registry path + command id such as `vigor3912s-mcp/src/commands/registry/families/show.ts#show_cpu`) — never embedded command output or secrets. CLI entries from this corpus use `firmwareBasis: "live-recon-4.4.7_RC2"` and `verifiedOnFirmware: "4.4.7_RC2"`. PDF-sourced CLI entries keep `firmwareBasis: "user-guide-v4.3.5.1"` and `verifiedOnFirmware: null`. Census invariant unchanged for the 327 PDF headings; recon entries are **additive** and do not replace PDF coverage. Session-logout meta-commands `exit` / `quit` are `status: "blocked-by-documentation"` (not SDK device operations). This amendment does **not** create a runtime dependency on `vigor3912s-mcp`.

**Amendment 2026-09-14 (root + user sign-off, public client transport seam):** This SDK must expose a **public `Transport` interface** (today under `internal/execution/transport.ts`; promote to e.g. `exports["./transport"]`) so a separate **client** package can implement the live wire (SSH, etc.). The SDK **must not** ship SSH, **must not** depend on the client package, and **does not define or track MCP concerns** — MCP is an out-of-repo consumer. Finish requirements: `HANDOVER.md` §6a–§6b (`REQ-SDK-1` … `REQ-SDK-6`).

1. **The SDK does not block anything.** `classification: "destructive"` is accurate metadata only, same status as `"read"`/`"write"` — it is not an exclusion mechanism. The `"excluded-by-safety"` status value and the "registry must never reference it" invariant are **removed**. Whether a write (destructive or not) can ever reach the router is entirely a function of the **consumer** (app policy, MCP confirm gate, `LiveReadOnlyClient`, or the injected `Transport`) — not a manifest-level ban and not an SDK authorization framework. This mirrors `vigor3912s-mcp`'s own separation: that project's hard blocklist / confirm gate lives in the MCP server (an application-policy choice appropriate for handing commands to an AI agent), not in a shared library — the same separation applies here: policy belongs to whatever consumes the SDK, not the SDK itself.
2. **Manifest entries are per documented command, not per raw-text heading.** Where one heading documents several distinct commands (e.g. "linux" covers `linux status`, `linux service ssh enable/disable/setport`, `linux setlinuxip`, `linux clean -a/-b/-d/-o/-w`, each with its own classification), the generator emits one entry per real command, each still citing back to its source heading. The "327 CLI headings" requirement means every heading is traceably covered by ≥1 entries, not that there are exactly 327 CLI entries — see the corrected census invariant below. `execute()` itself is unaffected by this change: it remains exactly one DrayOS CLI command per call, no chaining (`&&`/`;`/`|` stay rejected by framing, C2) — confirmed against the evidence that DrayOS's SSH server has no exec channel and its CLI is a fixed-vocabulary interactive prompt, not a real shell (`projects/vigor3912s-mcp/docs/01-overview/architecture.md`), so shell-chaining syntax has no meaning there regardless.

Produced by `joo-sa` (Opus) from `HANDOVER.md`, the evidence corpus, and current source; open questions below resolved directly by the user/root afterward.

## Cross-cutting layout

```
sdk/
  src/
    index.ts                          # root barrel — public surface only
    client.ts                         # Vigor3912SClient: raw execute + domain accessors
    errors.ts                         # error codes (extended, see Item 3)
    manifest/
      types.ts                        # CapabilityEntry union + manifest meta types
      capability-manifest.generated.ts# GENERATED, do not hand-edit
      index.ts                        # typed accessors: byId, byClassification, counts
    domains/<domain>.ts               # added one at a time, per manifest (Item 5)
    live/
      live-read-only-client.ts        # separate subpath export ("./live"), NOT in root barrel
      allowlist.ts
    internal/
      command-runner.ts               # existing seam (Task 2), unchanged signature
      execution/
        limits.ts  framing.ts  session-queue.ts  transport.ts  default-runner.ts
      registry/
        operation.ts  registry.ts
      parsers/<domain>/<operation>.ts
      fixture-importer.ts  fixture-redaction.ts   # existing (Task 3)
  tools/
    import-redacted-fixture.ts        # existing (Task 3)
    generate-capability-manifest.ts   # new (Item 1)
  tests/
    support/fake-transport.ts
    manifest/…  execution/…  domains/<domain>/…
```

`internal/` stays unexported **except** that the **`Transport` port** (and the minimal types an implementor needs: exchange result, limits inputs, framed command type) must be re-exported on a dedicated public subpath for the future **client** package — see Amendment 2026-09-14. `live/` remains a separate `package.json` `exports["./live"]` entry so a normal SDK import can never transitively reach live-connection policy code (safety boundary: `LiveReadOnlyClient` must not expose write/raw/destructive APIs "at runtime or in TypeScript types").

---

## Item 1 — capability manifest

- **Format: generated TypeScript module**, not JSON. `src/manifest/capability-manifest.generated.ts` exports `export const capabilityManifest = [...] as const satisfies readonly CapabilityEntry[]`. Rationale: build-time data, `satisfies` gives compile-time completeness for free, avoids a packaging change (`tsconfig.build.json` only includes/emits `src/**/*.ts`; a `data/*.json` file would not ship to `dist/`).
- **Generator input path: read directly from `.ai/skills/vigor3912s/references/cli-reference-raw.txt`** (across the skill/project boundary) — it is already the canonical extracted text; no copy into the project.
- **One discriminated array covers both corpora** (CLI + WebUI), so the 327/171 counts reconcile in one generated artifact:

```ts
type CapabilityEntry = CliCapabilityEntry | WebUiCapabilityEntry;

interface CapabilityEntryBase {
  readonly id: string; // stable slug, e.g. "cli.srv.nat.portmap.add"
  readonly title: string; // heading / menu title exactly as printed
  readonly citation: Citation; // MANDATORY, no entry without one
  readonly classification: Classification;
  readonly classificationBasis: ClassificationBasis;
  readonly status: CapabilityStatus; // MANDATORY final status
  readonly blockedReason?: string; // required iff status === "blocked-by-documentation"
  readonly operationIds: readonly string[]; // registry linkage; [] until implemented
}

interface CliCapabilityEntry extends CapabilityEntryBase {
  readonly kind: "cli-command";
  readonly command: string; // "srv nat portmap add"
  readonly commandPath: readonly string[];
  readonly firmwareBasis: "user-guide-v4.3.5.1" | "live-recon-4.4.7_RC2";
  readonly verifiedOnFirmware: null | "4.4.7_RC2"; // null for PDF-sourced; set for live-firmware-recon
}

interface WebUiCapabilityEntry extends CapabilityEntryBase {
  readonly kind: "webui-page";
  readonly menuPath: string; // "NAT >> Port Redirection"
  readonly captureStatus: "ok" | "js-empty";
  readonly firmwareBasis: "live-capture-4.4.7_RC2";
}

type Citation =
  | { readonly corpus: "user-guide-part-viii"; readonly rawLine: number; readonly pdfPage: number }
  | { readonly corpus: "webui-capture"; readonly captureFile: string; readonly indexRow: number }
  | {
      readonly corpus: "live-firmware-recon";
      readonly firmware: "4.4.7_RC2";
      readonly evidenceRef: string; // location pointer only, never content
    };

type Classification = "read" | "write" | "destructive" | "interactive" | "unknown";
type ClassificationBasis =
  | "documented-syntax"
  | "command-map-family"
  | "operations-danger-list"
  | "sibling-live-verified"
  | "unclassified";
type CapabilityStatus = "documented" | "implemented" | "blocked-by-documentation";
```

**Amendment 2026-09-13 (root audit, `sibling-live-verified` classification basis added):** A root audit cross-referenced this manifest's remaining `"unknown"`-classified/`"unclassified"`-basis CLI entries and its existing `"command-map-family"`-basis entries against the sibling `projects/vigor3912s-mcp` project's command registry (`src/commands/registry/{index,builders,types}.ts` + `registry/families/*.ts`, 217 commands / 42 families, **live-verified against the real router, fw 4.4.7_RC2** — a stronger evidence source than `command-map.md`'s summary tables alone, which this generator's existing `READ_ONLY_FAMILIES`/`WRITE_FAMILIES` lookup was built from). The audit produced two sets: 79 previously-`"unknown"` manifest entries that `vigor3912s-mcp` classifies consistently as one kind (`read` or `write`) — now resolved with the new `classificationBasis: "sibling-live-verified"`; and 9 entries whose existing `command-map-family` classification actively disagreed with the live-verified kind (`cli.ip.arp`, `cli.ip.route`, `cli.ip.session`, `cli.msubnet.status`, `cli.srv.dhcp.status`, `cli.vlan.status`, `cli.wan.detect`, `cli.wan.detectmtu`, `cli.wan.detectmtu6` — all corrected from `write` to `read`, also basis `"sibling-live-verified"`, since a live-verified per-command source outranks a coarse per-family summary table). As with the existing `vigor3912s-mcp` cross-check note above (Item 1's `command-map.md` bullet), this is evidence consulted and embedded as static data in the generator (`tools/generate-capability-manifest.ts`'s `SIBLING_LIVE_VERIFIED_CLASSIFICATION` table) — never a runtime dependency.

- `classification` defaults to `"unknown"`/`"unclassified"` — the generator never infers read/write from a command name.
- **Citations reference locations, never content** — no entry may embed capture text or PDF prose (captures contain a live auth token and operational identifiers).
- **Destructive commands are classified, not excluded** (amended 2026-09-13, see above): the four `operations.md` "never run" commands (`sys cfg default`, `sys reboot`, `mngt rmtcfg enable`, `linux clean -w/-o`) are emitted as ordinary entries with `classification: "destructive"`, basis `"operations-danger-list"`, `status: "documented"` — same as any other command. There is no status that removes them from the registry; the SDK models them accurately. Gating belongs to the consumer for both typed `invoke()` and raw `execute()` (caller owns command effects).
- **Streaming/tail-style commands are blocked, not limit-tuned.** `log -wt` (and any command documented as a continuous watch/tail rather than a single request/response) gets `status: "blocked-by-documentation"` with `blockedReason` explaining it doesn't fit the bounded single-exchange execution model (Item 3) until a dedicated streaming design exists. Do not attempt to cover it with a larger timeout/output cap. This status is a technical-fit limitation, not a safety exclusion — it is the only kind of "can't do this yet" left in the schema.
- **WebUI pages are included as manifest entries** (`kind: "webui-page"`), so the 171 count is accounted for and WebUI-only functions (config backup, firmware upgrade, port knocking, Fast NAT) are recorded as `blocked-by-documentation` with a real reason rather than silently omitted.
- **Executable count invariants** (`tests/manifest/census.test.ts`, amended 2026-09-13): every one of the 327 CLI headings and 171 WebUI rows is traceably cited by ≥1 manifest entry (coverage, not a fixed total) — a heading documenting several distinct commands (e.g. "linux", "sys cfg", "mngt rmtcfg", "linux service ssh ...") emits one entry per real command, all citing that same heading's `rawLine`/`pdfPage`; unique ids across the whole array; every entry has a citation and status; `blockedReason` present exactly when `blocked-by-documentation`. Where the summary tables in `command-map.md`/the raw PDF text list a piped or grouped syntax under one heading (e.g. `linux service ssh enable|disable|status|setport <port>`), split it into one entry per variant — cross-check the finer split, where available, against the already-live-verified command set in `projects/vigor3912s-mcp/src/commands/registry/families/*.ts` (a sibling project that already enumerated and classified 217 real DrayOS commands against fw 4.4.7_RC2), without copying its code or depending on it at runtime — it is evidence to consult, not a dependency. Known evidence traps the generator must still handle correctly: one CLI heading (`wan vlan`, line 11191 of `cli-reference-raw.txt`) is indented, so a naive `^`-anchored regex undercounts headings at 326; `webui-capture/text/` contains 3 `._`-prefixed files that are genuine, distinct, non-duplicate captures (not AppleDouble junk) already correctly counted in the 171 — do not filter them out.
- **Generator is a manual tool**, mirroring the Task 3 fixture importer: `npm run manifest:generate` (not part of `npm test`/`verify`), plus `npm run manifest:check` that regenerates to a temp path and diffs, so drift is caught in `verify` without the tool running implicitly.

---

## Item 2 — runner, typed-operation registry

**Amendment 2026-09-14 (ChangePlan removed):** `ChangePlan` / `VerifiedChangePlan` / `ChangePlanVerifier` / `denyAllVerifier` / `TypedWriteExecutor` are **removed**. The SDK is a typed CLI wrapper only — not an approval or authorization framework. Typed writes and destructive ops use the same `invoke(operation, input, options?)` path as reads. Classification remains manifest metadata. Consumer policy (`LiveReadOnlyClient`, MCP confirm, app gates, Transport) owns whether a write may run.

- **Keep the existing `CommandRunner` interface unchanged** (`internal/command-runner.ts`, Task 2, unexported). `DefaultCommandRunner` (`internal/execution/default-runner.ts`) implements it by composing framing + limits + queue + transport (Item 3). Both the public raw wrapper and typed operations use this one seam.
- **`TypedOperation` is a descriptor, not a class hierarchy:**

```ts
interface TypedOperation<TInput, TOutput> {
  readonly manifestId: string;
  readonly classification: "read" | "write" | "destructive";
  readonly buildFrames: (input: TInput) => readonly CommandFrame[];
  readonly parse: (exchanges: readonly CommandExchange[]) => TOutput;
  readonly executionOverride?: Partial<ExecutionLimits>; // see Item 3 diagnostic exception
}
type OperationRegistry = ReadonlyMap<string, TypedOperation<never, unknown>>;
```

Registry is a frozen map assembled from domain modules (Item 5 recommends self-assembly to avoid a shared-file bottleneck). Two invariant tests: every registry key exists in the manifest (any classification, including `"destructive"` — the manifest no longer forbids this, see the 2026-09-13 amendment above); every manifest entry with `status: "implemented"` has ≥1 registry entry.

- **`invoke()` is the single typed path** for every classification. The client requires the canonical registry descriptor (forged descriptors reject with `forged_operation_rejected`), builds frames, runs them through the injected runner/`Transport`, and parses exchanges. No separate write executor.
- **Raw `execute()`** stays the unrestricted single-command wrapper; the caller owns command effects. Do not invent a second authorization layer inside the SDK.

---

## Item 3 — `execute()` safety envelope (fake transport only, no real SSH yet)

- **`Transport` is a narrow injected port**; the runner never knows SSH exists:

```ts
interface Transport {
  readonly isOpen: boolean;
  send(
    frame: CommandFrame,
    limits: ExecutionLimits,
    signal: AbortSignal,
  ): Promise<TransportExchange>;
  close(reason: string): Promise<void>;
}
```

No SSH library is chosen or added in this sequence. Every test uses `tests/support/fake-transport.ts` with read-only samples only.

- **Framing rejects, never escapes.** `frameSingleCommand(input): CommandFrame` is a pure function returning a branded (unforgeable) `CommandFrame`. Rejects on: LF/CR, NUL and other C0/C1 control characters, `;`, `&`, `|`, backtick, `$(`, and empty/whitespace-only input. **Explicit carve-out: bare `?` and trailing `<cmd> ?` are allowed as valid single frames** (documented recon primitives, read-only) — needs a named test proving they pass framing despite looking degenerate.
- **`CommandResult.exitCode` is removed.** A serialized interactive DrayOS CLI session yields prompt-delimited text, not a per-command exit status; fabricating `0` was rejected as inventing runtime truth. If a caller needs outcome signalling later, it must come from a documented parser (`outcome: "completed" | "error-text-detected"`), added only if a real need appears — not part of this sequence.
- **Limits (final, root+user approved):**

```ts
interface ExecutionLimits {
  readonly maxCommandBytes: number; // 1024
  readonly commandTimeoutMs: number; // 15_000
  readonly idleTimeoutMs: number; // 5_000  (no new output bytes)
  readonly maxOutputBytes: number; // 4 * 1024 * 1024 (4 MiB)
}
```

These are engineering defaults (DrayTek's docs specify no vendor limits) — `maxCommandBytes` gives ~5-8x headroom over the longest documented command syntax (e.g. `srv nat portmap add ...`); `maxOutputBytes` is sized generously for `show session`/`show statistic` tables on a business-grade router. Exceeding `maxOutputBytes` throws `OutputLimitExceededError` and closes the session — it never silently truncates (output sensitivity is unknown).

- **`resolveLimits(defaults, options)` clamps for the raw wrapper only**: `ExecuteOptions.timeoutMs` may lower `commandTimeoutMs` but never raise it above the 15s default.
- **Diagnostic exception, not a caller override:** `ip ping` / `ip tracert` are active network probes that can legitimately run far longer than 15s. They get their own reviewed, hard-coded ceiling via the typed operation's `executionOverride` (recommend 60s), defined in the registry entry itself — never via ad-hoc caller-supplied `timeoutMs`. The raw `execute()` global default is not raised to accommodate them.
- **Serialization**: `SessionQueue` — FIFO promise-chain, max concurrency 1, `AbortSignal` removes queued items, closed session rejects immediately. No mutex library (YAGNI).
- **No-logging is architectural, with a test.** No logger/`console`/telemetry anywhere under `internal/execution`. Error types carry only identity metadata (manifest id, byte length, elapsed ms) — never the command string body, stdout, or stderr. `tests/execution/no-output-leak.test.ts` drives the fake transport with a canary string and asserts it never appears in any thrown error's `message`/`cause`/serialized form; an ESLint `no-console` rule scoped to that directory enforces it structurally.
- **New error codes**, extending the existing `sdkErrorCodes` object (Task 2 shape, no parallel hierarchy): `command_framing_rejected`, `execution_timeout`, `output_limit_exceeded`, `session_closed`, `change_plan_unverified`, `live_client_rejected`.

---

## Item 4 — transport/session policy and `LiveReadOnlyClient`

- **Policies are declarative data**, unsafe values made unrepresentable via literal types:

```ts
interface TransportPolicy {
  readonly allowedHostKinds: readonly ["private-lan"]; // LAN-only (operations.md safety rule)
  readonly port: number;
  readonly connectTimeoutMs: number;
  readonly allowAgentForwarding: false;
}
interface SessionPolicy {
  readonly maxConcurrentCommands: 1;
  readonly idleTimeoutMs: number;
  readonly maxSessionMs: number;
}
```

- **Two independent keys gate every live-callable operation**: (a) its manifest entry has `classification: "read"` and `status: "implemented"`, **and** (b) its id appears in a hand-maintained `liveReadOnlyAllowlist` const in `src/live/allowlist.ts`. A generated manifest alone can never widen live reach; a human edit alone can never bypass the manifest.
- **Seed allowlist candidates** (from `command-map.md`'s "Status & diagnostics (read-only, safe)" table; final authoritative status still comes from the Item 1 manifest classification):
  `sys version, show status, wan status, show lan, show dmz, show dns, show nat, show portmap, show session, show traffic, show clienttraffic, show statistic, sys health, linux status`
  Unused until item 4's guard chain has tests AND the user gives separate explicit authorization for any live connection — this list is not a green light to connect.
- **`LiveReadOnlyClient`'s surface is derived**, so writes are a type error, not just a runtime check: methods are `Pick<ReadOperationsMap, LiveReadOnlyId>`. No `execute`, no runner accessor, no domain accessor that carries writes.
- **Pre-connect guard chain, all evaluated before any socket**, in order: (1) `VIGOR_E2E_READ_ONLY === "true"` exactly; (2) every requested id in the allowlist with manifest classification `read`; (3) transport policy host check; (4) assertion that no write/destructive/raw capability is reachable from the constructed surface. Any failure throws `LiveClientRejectedError` before `transport.connect`. Proving test: inject a fake transport, assert `connect` is never invoked on guard failure.
- **Credentials: reuse `projects/vigor3912s-mcp/.env`** (fields already present: `VIGOR_HOST`, `VIGOR_PORT`, `VIGOR_USER`, `VIGOR_PASSWORD`) — no separate `.env` for the SDK. Add `VIGOR_E2E_READ_ONLY=true` as a new required variable read by the SDK's own E2E harness. Never read/print/copy/commit these values; the SDK's guard chain only checks presence/shape of `VIGOR_E2E_READ_ONLY`, never logs credential values.
- **Explicit stop: this sequence ends at policies + guards + fake-transport tests.** No E2E or live-router connection work begins without separate, explicit user authorization requested at that time. Adding `package.json` `exports["./live"]` is a deliberate public-surface change and should be its own reviewed step.

---

## Item 5 — incremental domain modules

- **One module per documented command family**, added only when it has ≥1 implemented operation: `src/domains/sys.ts`, `wan.ts`, `srv-nat.ts`, etc. Families come from the manifest's `commandPath[0]`, not from `command-map.md` prose directly (the map is citation evidence; the generated manifest is the contract). No empty placeholder domain modules.
- **`defineOperation` is the single construction point** for every typed operation — requires `manifestId`, `classification`, `buildFrames`, `parse`. A `manifestId` that is absent or of the wrong classification fails at test time (a `"destructive"` classification is a valid, implementable operation like any other — see the 2026-09-13 amendment above; consumers own whether it may run against a live target). This is what makes "every typed operation needs a citation" mechanical. No operation may exist without a manifest entry (`getWanIp` stays absent; its exclusion test stays, per Task 2).
- **Parsers are pure**: `internal/parsers/<domain>/<operation>.ts`, signature `(text: string) => TOutput`, no I/O, no transport, no clock, no runtime schema library (YAGNI unless a real need appears later, as its own decision).
- **Fixed four-test convention per operation** (`tests/domains/<domain>/<operation>.test.ts`): (1) frame construction incl. rejection cases, (2) parser against a redacted fixture from the accepted Task 3 importer, (3) manifest linkage (id exists, status `implemented`, classification matches), (4) limits/failure behaviour via fake transport. Fixtures only from `tests/fixtures/` redacted copies.
- **Progress tracking: the manifest `status` field is the only tracker** — no parallel checklist/inventory doc (DRY).
- **Coverage tooling**: add `@vitest/coverage-v8` (or the exact-pinned equivalent resolved from official sources at implementation time) since "coverage linkage" in item 5 requires it and it doesn't exist in `package.json` yet. Pin the exact version per the existing decision-table rule ("resolve stable versions from official sources and pin them exactly").
- **Task granularity for planning**: one manifest entry (or one tight family, e.g. `srv nat portmap *`) per `joo-dev` task. Write scopes are naturally non-overlapping (`domains/<d>.ts`, `parsers/<d>/*`, `tests/domains/<d>/*`) **except** the shared registry barrel and the manifest `status` flip. Recommend the registry **self-assembles** from domain modules (each domain module registers its own operations) to remove that shared-file bottleneck entirely and allow real parallel `joo-dev` waves once Items 1-4 are done.

---

## Resolved decisions log (root/user, after `joo-sa`)

| #   | Question                                                 | Resolution                                                                                                                                                                                                                                      |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | `CommandResult.exitCode` shape                           | Removed entirely. No exit-code fabrication.                                                                                                                                                                                                     |
| Q3  | Manifest artifact format                                 | Generated TypeScript module (`satisfies`), not JSON.                                                                                                                                                                                            |
| B2  | `.env` source for future E2E                             | Reuse `projects/vigor3912s-mcp/.env`; add `VIGOR_E2E_READ_ONLY=true`. No separate SDK `.env`.                                                                                                                                                   |
| Q4  | Coverage tooling missing                                 | Add a pinned coverage provider when Item 5 starts; not needed for Items 1-4.                                                                                                                                                                    |
| Q5  | Include WebUI pages as manifest entries?                 | Yes, `kind: "webui-page"`.                                                                                                                                                                                                                      |
| Q6  | Generator input path across project/skill boundary       | Read directly from `.ai/skills/vigor3912s/references/cli-reference-raw.txt`; no copy.                                                                                                                                                           |
| Q7  | Framing carve-out for `?` / `<cmd> ?`                    | Allowed explicitly, with a named test.                                                                                                                                                                                                          |
| Q8  | `verifiedOnFirmware: null` acceptable as "final status"? | Yes — true device verification requires the Item 4 E2E gate, out of scope here.                                                                                                                                                                 |
| —   | `execute()` numeric limits                               | `maxCommandBytes: 1024`, `commandTimeoutMs: 15_000`, `idleTimeoutMs: 5_000`, `maxOutputBytes: 4 MiB`; `ip ping`/`ip tracert` get a separate hard-coded `executionOverride` ceiling (60s) in their registry entry, not a caller-raisable option. |
| —   | Streaming/tail commands (e.g. `log -wt`)                 | `status: "blocked-by-documentation"` in the manifest; excluded from the Item 3 limits model rather than given a larger timeout.                                                                                                                 |
| —   | Allowlist seed set                                       | See Item 4; not authoritative until manifest classification exists; unused until explicit E2E authorization.                                                                                                                                    |

## Still out of scope for this whole sequence

No real SSH transport, no live router connection, no git/GitHub action, no SDK-owned authorization/confirm framework, no `.env` value ever read/printed/logged by generated code or tests. Per `HANDOVER.md`: any of these needs separate, explicit user authorization when the time comes.
