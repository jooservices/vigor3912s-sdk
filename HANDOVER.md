# Vigor3912S SDK — Handover (updated 2026-09-14, public typed API pending)

**User directive:** fully complete every command (100% SDK support within safety rules). Architecture amendment for `Citation` corpus `"live-firmware-recon"` is **approved** (see `ARCHITECTURE.md`). This document is for the next developer/AI session — read it fully before touching anything.

## 0. Read order

1. This file (context + safety boundary + exact current state + how to run things).
2. `projects/vigor3912s/sdk/ARCHITECTURE.md` — the approved architecture, including dated amendments. **Gate is closed** — do not redesign; amend only with root+user sign-off.
3. `projects/vigor3912s/sdk/BACKLOG.md` — the approved backlog + status log.

## 1. Non-negotiable safety boundary (unchanged, still binding)

- Never send a write, save, update, commit, reboot, reset, enable/disable, or other state-changing command to the real Vigor3912S router. **Nothing has ever connected to the real router in this whole project.** All tests use a fake transport (`tests/support/fake-transport.ts`).
- The SDK **does not block anything** at the manifest level for safety: `classification: "destructive"` is accurate metadata only. **Amendment 2026-09-14:** `ChangePlan` / verifiers are **removed**. The SDK is a typed CLI wrapper; write policy belongs to consumers (`LiveReadOnlyClient`, MCP, app).
- `execute()` is exactly **one DrayOS CLI command per call**, no shell chaining (`&&`/`;`/`|` rejected by framing).
- `LiveReadOnlyClient` must reject before connecting; no live/E2E work without **separate, explicit user authorization**.
- Never read/print/copy/commit `.env` values.
- Never import or create a runtime dependency on `vigor3912s-mcp` — **read-only evidence only**. Work surface is **SDK only**.
- Never guess a command's safety classification from its name. Classification is generator-owned, evidence-only.

## 2. Gated delivery workflow — Architecture/Planning closed

Every unit of work goes through: `joo-dev` → `joo-reviewer` → `joo-qa` → root accepts.

Full role contracts: `.ai/guides/subagent-delivery.md`.

## 3. Critical operational setup — do this first

```bash
cd projects/vigor3912s/sdk
nvm use   # .nvmrc -> 24.21.0; npm install -g npm@12.0.2 once if needed
```

Standard gate:

```bash
npm ci && npm run format:check && npm run lint && npm run typecheck && npm run build && npm test && npm run manifest:generate && npm run manifest:check && npm run verify
```

Notes:

- `manifest:generate` / `manifest:check` use narrow `tsconfig.generator.json`.
- Generator reads `.ai/skills/vigor3912s/references/cli-reference-raw.txt` from outside `sdk/` (3 levels up).

## 4. Exact current state (2026-09-14, verified via `npm run verify` + census)

- **2346/2346 tests pass, 494 test files.**
- **649 manifest entries** (478 `cli-command` + 171 `webui-page`).
- **472 CLI operations implemented** across **42 domain modules** (`src/domains/*.ts`).
- **0** CLI entries left `status: "documented"`.
- **6** CLI entries `blocked-by-documentation` (complete for SDK purposes — not missing work):
  - `cli.exit`, `cli.quit` — session-logout meta (user decision)
  - `cli.ip.telnet` — nested interactive telnet session
  - `cli.ipf.flowtest`, `cli.sys.admin` — RD/debug, no Syntax/Parameter Description
  - `cli.hsportal.pingen` — Part VIII “for future use” only
- **24** additive `live-firmware-recon` CLI entries (fw 4.4.7_RC2, not in PDF) — all implemented.
- PDF heading census still **327** distinct Part VIII citations; recon is additive.
- WebUI pages remain catalogued (171); WebUI TypedOperations were never in scope for this completion push.
- Public client-facing transport seam is complete: `./transport` exports the
  wire contract, `Vigor3912SClient.fromTransport(...)` provides first-class
  injection, `docs/transport.md` documents implementor semantics, and README /
  metadata are honest that SSH is not in this SDK.
- Coverage gate is now enforced globally by `vitest.config.ts` at >=90%.
  Current coverage: statements **99.59%** (4711/4730), branches **94.28%**
  (1896/2011), functions **99.94%** (1770/1771), lines **99.59%** (4683/4702).
- `npm audit --audit-level=moderate` reports **0 vulnerabilities**.
- Docker/container QA passed independently in `node:24.21.0-bookworm` with npm
  12.0.2: `npm ci`, `npm run verify`, `npm pack --dry-run`, and installed
  consumer smoke all passed.
- **Newly approved scope, not implemented:** the user wants the typed CLI
  operations callable through a public package API. See §6c. The verification
  figures above describe the completed transport baseline, not this new API.

### What's been built (accepted path)

1. Items 1–4 of architecture (manifest, runner/registry, `execute()` envelope, `LiveReadOnlyClient` guards).
2. Registry self-assembly (`src/internal/registry/self-assembly.ts`).
3. Classification from command-map + sibling-live-verified + documented-syntax overlays + heading splits.
4. Full Wave 4 domain coverage for every implementable CLI entry, including formerly zero families (`dos`, `internet`, `port`, `portmaptime`, `radius`, `appqos`, `log`, plus recon families `fs`, `dpdk`, `vrrp`).

### Known tracked follow-ups (not blockers for “every CLI command modeled”)

- Heading-split follow-ups still noted historically for blanket-`read` entries that also document write sub-forms (`cli.ip.arp`, `cli.ip.route`, `cli.ip.session`, `cli.wan.detect`, `object.ip.obj`, `usb.temp`, etc.) — already implemented as narrowed read ops; expanding write sub-forms is optional enrichment.
- ~~`TypedOperation.classification` is still `"read" | "write"` only~~ — **resolved 2026-09-14**: widened to `"read" | "write" | "destructive"`; the 5 destructive ops (`cli.sys.reboot`, `cli.sys.cfg.default`, `cli.mngt.rmtcfg.enable`, `cli.linux.clean.o`, `cli.linux.clean.w`) now report `classification: "destructive"` at runtime, matching the manifest exactly. Classification remains metadata only (ChangePlan removed 2026-09-14).
- `srv` DHCP shapes vs sibling MCP LAN-scoping discrepancy — documented drift, accepted.
- WebUI capability TypedOperations — out of scope unless newly requested.
- Read-only audit: whether this SDK can replace `vigor3912s-mcp`'s hand-rolled registry — still a separate question.

## 4a. Independent audit of the completion push (2026-09-14, root + 3 `joo-auditor` + 11 `joo-dev`)

A second AI session applied the completion push above unsupervised. Root then ran 3 parallel `joo-auditor` passes (citation integrity, test quality, architecture/safety) to independently verify every claim with reproduced evidence, not trust.

**Result: no fabrication, no safety-boundary violation, no runtime coupling to `vigor3912s-mcp`.** All headline numbers (472 ops / 6 blocked / 24 recon / 2114 tests / 649 manifest entries) were independently reproduced from a clean `npm ci`. All 24 `live-firmware-recon` `evidenceRef` citations resolve to real sibling entries with matching read/write kind. All 6 `blocked-by-documentation` reasons check out against the raw PDF text (5 are genuinely undocumented; `cli.ip.telnet` is documented but blocked for a different, legitimate reason — technical fit, not missing evidence — see §4's breakdown, which already distinguishes these).

**One real defect found and fixed:** every newly-added operation's 4th ("fake-transport round-trip") test called `FakeTransport.send()` directly and asserted only `.rejects.toThrow()` — this can only ever catch `FakeTransport`'s own hardcoded close error, never a broken `session_closed` error-code wiring in the real `DefaultCommandRunner`. Fixed via 11 parallel `joo-dev` tasks (one per new family: `dos, internet, log, port, portmaptime, radius, appqos, fs, dpdk, vrrp`, plus one for the 13 new `sys` ops) to route through `DefaultCommandRunner` and assert `.rejects.toMatchObject({ code: "session_closed" })`, matching the pre-existing `tests/domains/sys/test-helpers.ts` pattern. Also fixed one root-side scoping gap (`dos/whitelist-show.test.ts` was missed in the initial dev-task split) and a misleading test title (`sys/eap-tls.test.ts`). Re-verified fully green afterward: `npm ci && format:check && lint && typecheck && build && test && manifest:generate && manifest:check` — 491 files / 2114 tests, no manifest drift.

**Two suggestions from the test-quality audit were reviewed and explicitly rejected**, not applied: adding "structured" parsers for `dpdk statistic`, `portmaptime -l`, `dos -P/-B show`. Checked both the vendor PDF and the sibling registry — neither documents an actual output schema for these; the existing raw-passthrough parser is the honest choice (inventing a structure would fabricate unevidenced data). Left as-is.

**Follow-up (2026-09-14, same day, user approved): retrofitted the same fix across the entire pre-existing codebase.** The weak item-4 pattern turned out to affect ~320 test files across 30 families (`apm, csm, ddns, ha, hsportal, ip, ip6, ipf, ldap, linux (partial), mngt (partial), msubnet, nand, object, qos, service, srv, switch, swm, tacacsplus, testmail, upnp, usb, user, vigbrg, vlan, vpn, wan, wol, local_8021x` — everything except `show` and most of `sys`, which already used the strong pattern) — this predates the completion push entirely; it is the original convention used since Wave 1. Fixed via 18 parallel `joo-dev` tasks (grouped by family, small families bundled together) plus one direct root fix (`nand/usage.test.ts`, missed by the family grouping). Every family's shared test-support file gained `dispatchThroughFakeTransport`/`expectClosedTransportFailure` helpers (added to `linux`'s and `mngt`'s existing `test-helpers.ts` where a same-named pair didn't already exist), and every 4th test block now routes through the real `DefaultCommandRunner` and asserts `.rejects.toMatchObject({ code: "session_closed" })`. Final state, independently re-verified end-to-end: `npm ci && format:check && lint && typecheck && build && test && manifest:generate && manifest:check` all green — **491 files / 2114 tests**, no manifest drift, zero remaining weak-pattern files anywhere under `tests/` (confirmed by a project-wide grep; the one remaining `rejects.toThrow()` hit, in `tests/change-plan/deny-all-verifier.test.ts`, is an unrelated verifier test that already asserts the specific error code elsewhere in the same file — not an instance of this defect).

**Documentation fixes made in the same pass (comment/count only, no behavior change):**

- `tools/generate-capability-manifest.ts`'s `SIBLING_LIVE_VERIFIED_CLASSIFICATION` comment claimed 6 `cli.sys.*` ids were "not implemented yet" — they already are; comment corrected.
- `ARCHITECTURE.md`/`BACKLOG.md` claimed "80 resolved + 9 corrected = 89" sibling-live-verified entries; the actual table has 88 unique keys (79 + 9). Both docs corrected to 79/88.
- `log`'s SPLIT_FAMILIES entry now has a comment explaining why `-i` (named in the syntax bracket, never described) is deliberately left unrepresented rather than guessed.
- Outer `projects/vigor3912s/HANDOVER.md` (frozen at the Task-3 scaffold milestone) got a banner pointing to this file as the current one.

The 491-file / 2114-test numbers in this section are historical snapshots from
the CLI-completeness and test-retrofit audits. The current SDK verification
snapshot is the 494-file / 2346-test state in §4.

## 4b. Public transport seam completion (2026-09-14, root verified)

REQ-SDK-1 through REQ-SDK-6 are implemented. Current evidence:

The requirement-to-code/test/QA map is in
`docs/features/sdk-transport/report.md`.

- `./transport` is a public package export for `Transport`,
  `TransportExchange` / `CommandExchange`, `CommandFrame`, and
  `ExecutionLimits`.
- `Vigor3912SClient.fromTransport(transport)` injects a public `Transport`
  without exposing runner internals.
- `docs/transport.md` documents one frame -> one exchange, no shell chaining,
  `ExecutionLimits`, `AbortSignal`, `close(reason)`, `isOpen`, output limits,
  timeout/error semantics, and DrayOS prompt/pager responsibilities for
  implementors.
- `FakeTransport` remains the reference contract fixture for SDK tests and
  implementor examples, not a production wire.
- Transport-related error codes are public and still asserted on real runner
  failure paths.
- README and `sdkMetadata.status` state the SDK owns typed operations and the
  transport interface only; SSH/live client code belongs outside this package.

Safety remediation completed in the same pass: `LiveReadOnlyClient` now uses
the canonical manifest/registry instead of caller-supplied fake operation
metadata, and it dispatches through the bounded runner. Reviewer findings F-1,
F-3, and F-4 were verified fixed. Optional F-2 remains a documented
cooperative-timeout risk: every `Transport` implementation **must** honor
`AbortSignal`.

## 5. Pattern for a new family / op

Unchanged from prior handover: query manifest → only implement already-classified entries → `src/domains/<family>.ts` + parsers + four-test convention → `npm run manifest:generate` (never hand-edit `*.generated.ts`). Precedent: `wan.ts` / `nand.ts` / `log.ts`.

## 6. What's left

For **REQ-SDK-1 through REQ-SDK-6**: **done**. CLI command completeness and the
public client-facing transport contract are done, and independent
Docker/container QA has passed. The subsequently approved public typed API is
**not yet implemented**; see §6c.

Optional next work (needs explicit user ask and, for live work, separate safety
authorization):

1. WebUI TypedOperations / blocked WebUI-only flows.
2. Live E2E (requires separate authorization + `.env` policy).
3. Optional heading-split enrichment for write sub-forms under already-implemented read ops.
4. Separate SSH client package / consumer-side adapter that implements
   `Transport`.

(Item-4 test retrofit across all pre-existing families is **done** — see §4a.)

### 6a. Client interface (user decision 2026-09-14)

This SDK’s finish-line toward a separate **client** package:

- SDK owns a **public wire interface** (`Transport` and the minimal types an
  implementor needs).
- A future **client** package implements that interface (e.g. DrayOS SSH).
- **This SDK does not care about MCP** — no MCP requirements, adapters,
  registry parity, or `VigorClient` work in this package.

```text
client  →  implements  →  sdk/transport (public)
sdk     →  uses         →  Transport (injected); never imports client
```

SSH / live connect stay **out of this package**.

### 6b. Requirements to finish the SDK (completed 2026-09-14)

Only the **client-facing transport contract** and related SDK wiring were
authorized. No MCP and no SSH/live client work were added.

| ID            | Priority | Requirement                                                                                                                                                                                                                                                                                      | Acceptance (DoD)                                                                                                                                       |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **REQ-SDK-1** | P0       | **Public `Transport` contract** — move/re-export `Transport`, `TransportExchange` / `CommandExchange`, and the frame type the wire must accept (`CommandFrame` or opaque brand) on a public subpath (e.g. `exports["./transport"]` → `src/transport/index.ts`). Keep runner internals private.   | Client can `import type { Transport } from "@jooservices/vigor3912s-sdk/transport"` without `internal/`. Build emits the subpath; existing tests pass. |
| **REQ-SDK-2** | P0       | **Documented `Transport` semantics** — one frame ↔ one exchange; no shell chaining; honor `ExecutionLimits` / `AbortSignal`; `close(reason)`; `isOpen`; no fabricated exit codes. Note DrayOS interactive-shell expectations for _implementors_ (prompt / pager) without implementing them here. | `docs/transport.md` (or README section) + JSDoc on public types.                                                                                       |
| **REQ-SDK-3** | P0       | **First-class `Transport` injection** — documented, tested public path to construct the SDK client/runner with an injected `Transport`. Zero-arg may stay fail-closed without a runner.                                                                                                          | Inject `FakeTransport` via public API; `execute` / domain op round-trip works.                                                                         |
| **REQ-SDK-4** | P1       | **Reference fake** — keep `FakeTransport` (or a clear test helper) as the contract reference for client implementors.                                                                                                                                                                            | Documented; not implied as production wire.                                                                                                            |
| **REQ-SDK-5** | P1       | **Stable transport-related error codes** — public codes for wire failures the client will surface (`session_closed`, `execution_timeout`, `output_limit_exceeded`, and connect/auth equivalents if needed).                                                                                      | Codes exported; runner tests assert them.                                                                                                              |
| **REQ-SDK-6** | P2       | **Docs / metadata honesty** — README + `sdkMetadata.status`: SDK has typed ops; **no SSH here**; client implements `Transport`.                                                                                                                                                                  | Matches §4 + §6a.                                                                                                                                      |

All six requirements are complete. Current verification evidence:
`npm run verify` green (494 test files / 2346 tests), `manifest:check` green
(649 entries), global coverage thresholds satisfied, and
`npm audit --audit-level=moderate` reports 0 vulnerabilities. Container QA also
passed with `npm ci`, `npm run verify`, `npm pack --dry-run`, and installed
consumer smoke.

**Out of scope for this package:** real SSH/`ssh2`, host-key pin, live `.env`, anything MCP-specific.

**Downstream:** a separate SSH client library may exist under
`projects/vigor3912s-client`. That package is **standalone** (generic SSH API).
This SDK must not require it to know about SDK types; if integration is needed
later, an **adapter lives in the consumer** (implements `Transport` by calling
the SSH client). The SDK-side REQ-SDK-1 prerequisite is complete.

### 6c. New public typed API request (user-approved scope; implementation pending)

On 2026-09-14, the user explicitly approved exposing the 472 typed CLI
operations through a public SDK API so another package can call them directly.
This is **new scope after** the completed REQ-SDK-1–6 transport work. No code
for this API was changed in the approval/handover turn; no new tests or QA have
run for it. Do not report this request as complete based on §4's baseline.

Current code facts to start from:

- `src/domains/*.ts` exports individually typed operation descriptors, but
  `src/internal/registry/registry.generated.ts` aggregates them as an internal
  `OperationRegistry` whose values erase each operation's input/output types.
- `package.json` exports only `.`, `./live`, and `./transport`.
  `Vigor3912SClient` exposes raw `execute()` and `fromTransport()` in
  `src/client.ts`; it has no public typed-operation invocation method.
- `LiveReadOnlyClient.invoke(id)` is a distinct, allowlisted live-only surface
  returning `Promise<unknown>`; it is not the general typed API requested.
- `ARCHITECTURE.md` Item 2 keeps typed writes/destructive operations behind
  consumer policy (MCP confirm / `LiveReadOnlyClient` / app). Raw `execute()` and typed `invoke()` both dispatch when a runner/`Transport` is injected — caller owns effects.
  remains a separate caller-owned path. Do not silently weaken either rule.

Next delivery step: audit the current descriptors/registry and agree a public
API shape and acceptance criteria with the user before implementation. The
recommended design goal is a named, importable operation with preserved
`TInput`/`TOutput`, invoked through the existing bounded runner; authenticate
it against canonical registry/manifest metadata so a caller cannot forge a
"read" descriptor for a write command. Clarify how public typed writes are
represented while the default verifier denies them. Keep SSH, real router
access, `.env`, MCP, and live E2E outside this change.

Plan bounded implementation tasks and test public consumer imports,
compile-time input/output types, fake-transport read dispatch, rejection of
forged/write/destructive operations, package build/exports, and documentation.
Then run format, lint, typecheck, build, tests, manifest check, and the global
unit-coverage gate of at least 90%, followed by independent container QA. The
full delivery gates in workspace `AGENTS.md` apply; the user has approved the
goal, not yet an architecture or task breakdown. No commit, push, or GitHub
action was authorized.

## 7. Things NOT to do

- Do not re-run `joo-sa` / `joo-team-lead` for the closed Items 1–5 or §6b
  (REQ-SDK-*) scope.
- Do **not** add `ssh2` or any live network transport here — that belongs in the **client** package.
- Do **not** add MCP requirements, MCP adapters, or MCP registry work to this SDK.
- Do not import a future client package from the SDK (SDK owns the interface; client implements it).
- Do not commit/push/`gh` without asking.
- Do not guess classifications.
