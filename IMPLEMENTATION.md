# IMPLEMENTATION — vigor3912s-sdk: typed input schemas + MCP gap closure

Status: **In progress** (2026-09-29). Target release: **1.1.0** (minor, additive).
Companion plan (consumer side): [`../vigor3912s-mcp/IMPLEMENTATION.md`](../vigor3912s-mcp/IMPLEMENTATION.md).
Root summary: [`docs/01-projects/vigor3912s-sdk/IMPLEMENTATION.md`](../../docs/01-projects/vigor3912s-sdk/IMPLEMENTATION.md).

---

## 1. Business requirements

| ID   | Requirement                                                                                                                                                                                        | Why                                                                                                                                                                                                                                  |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BR-1 | Every implemented SDK operation must be usable by a downstream consumer (the MCP server) **without the consumer re-describing the command's inputs**.                                              | The MCP duplicated DrayOS command knowledge in 118 hand-written tools; several had drifted from the documented CLI syntax (e.g. `ip addr LAN1 <ip>` vs documented `ip addr <ip>`). One source of truth removes that class of defect. |
| BR-2 | Input descriptions must be machine-readable and always in sync with the SDK's own typed inputs.                                                                                                    | A schema that can drift from the code is another copy of the same knowledge.                                                                                                                                                         |
| BR-3 | The SDK must stay dependency-free at runtime.                                                                                                                                                      | The SDK is a library embedded in other packages; zero runtime deps is an existing, published promise.                                                                                                                                |
| BR-4 | Command forms that the MCP proved are needed (live-verified or documented) but the SDK does not model must be added to the SDK, so the MCP never has to fall back to raw command strings for them. | “MCP fully uses the SDK” is only true when the SDK covers everything the MCP exposes.                                                                                                                                                |
| BR-5 | Change is additive: existing SDK callers keep working unchanged.                                                                                                                                   | Minor release, no migration for consumers.                                                                                                                                                                                           |

Out of scope: WebUI-only functions (171 `webui-page` manifest entries), SSH transport (lives in `ssh-client`), MCP policy (confirm/audit).

## 2. High-level technical design

```
src/domains/*.ts  (TypedOperation<XxxInput, Out>, ~267 *Input TS types)
        │  TypeScript compiler API (dev-time only)
        ▼
tools/generate-input-schemas.ts ──► src/schemas/input-schemas.generated.ts
        ▲ called by                        │ (manifestId → JSON Schema | null)
tools/generate-capability-manifest.ts      ▼
  (manifest:generate / manifest:check)   src/schemas/index.ts ──► package export "./schemas"
```

- **Schema source** = the TS `*Input` type argument of each exported `TypedOperation`, resolved by the TypeScript checker. No hand-written schema, no runtime dependency.
- **Keying** = `manifestId` (verified unique across all 472 ops; `assembleOperationRegistry` already throws on duplicates).
- **Emitted JSON Schema subset**: `type`, `properties`, `required`, `additionalProperties: false`, `enum`, `const`, `oneOf`, `items`, `description`. No `$ref`. `null` = op takes no input.
- **Mapping rules**: optional prop → not in `required`; `readonly` ignored; string-literal union → `enum`; single literal → `const`; union of objects → `oneOf`; mixed literal/object union → `oneOf` of `const` + object; homogeneous tuple → `array`; `Foo | undefined` at top level → `Foo`; `void`/`never` → `null`; JSDoc → `description`.
- **Fail loudly**: index signatures, `any`/`unknown`, heterogeneous tuples, non-object intersections → `InputSchemaGenerationError` listing every offending `manifestId` + type text. Never `{}`.
- **Correlation guard**: per domain file, static `operations` array element count must equal runtime ops for that file; statically readable `manifestId`s are cross-checked by position.
- **Drift gate**: `manifest:check` (inside `npm run verify`) fails when the committed schema file differs from a fresh generation.
- **Gap closure (S2)** follows the 2026-09-13 amendment precedent (`sys cfg` / `mngt rmtcfg` split): a heading whose read form is modelled but whose documented write sub-forms are not gets separate, accurately classified manifest entries + ops.

## 3. Code structure

```
vigor3912s-sdk/
├── package.json                         exports["./schemas"] (new)
├── tsconfig.json                        allowImportingTsExtensions (generator import only)
├── tsconfig.build.json                  turns it back off for emit
├── src/
│   ├── schemas/                         (new)
│   │   ├── index.ts                     inputSchemas, inputSchemaFor(), type JsonSchema
│   │   ├── json-schema-types.ts         hand-written JsonSchema subset type
│   │   └── input-schemas.generated.ts   GENERATED — do not edit
│   └── domains/{ip,ddns,wan}.ts         S2: new write sub-form ops / optional forms
├── tools/
│   ├── generate-input-schemas.ts        (new) TS-compiler-API schema generator
│   └── generate-capability-manifest.ts  calls it; write/check artifact
└── tests/
    ├── schemas/{census,spot-checks,round-trip}.test.ts
    ├── tools/generate-input-schemas.test.ts
    ├── fixtures/input-schemas/{happy-path,unsupported-constructs,count-mismatch,manifest-id-mismatch}/
    └── domains/<family>/…               S2: tests for new ops
```

## 4. Tasks

Legend — Status: `done` / `in-progress` / `backlog` / `blocked`. Traceability: BR ↔ task ↔ TC.

### S1 — Generate and export input JSON Schemas · `done` (review approved 2026-09-29)

- **Business requirement**: BR-1, BR-2, BR-3, BR-5.
- **Technical**: see §2. Public API:
  ```ts
  // @jooservices/vigor3912s-sdk/schemas
  export const inputSchemas: Readonly<Record<string, JsonSchema | null>>;
  export function inputSchemaFor(manifestId: string): JsonSchema | null | undefined;
  export type { JsonSchema };
  ```
- **Acceptance criteria**
  - AC-1 `inputSchemas` has exactly one key per implemented operation (472) and no other keys.
  - AC-2 Void ops map to `null`; all others to a non-null schema (182 null / 290 non-null at 1.0.0 corpus).
  - AC-3 Only the allowed keyword subset appears anywhere in any schema.
  - AC-4 Unsupported TS constructs abort generation with an aggregated, named error.
  - AC-5 `npm run verify` fails if the committed schema file drifts.
  - AC-6 `dependencies` in `package.json` stays empty; `npm pack` ships `dist/schemas/*`.
- **DoD**: `npm run manifest:generate && npm run verify` green (format, lint, typecheck, build, tests, manifest:check, coverage thresholds, audit); reviewer approve; CHANGELOG Unreleased, README, `docs/usage.md` “Input schemas”, ARCHITECTURE amendment 2026-09-29.
- **Test cases**

  | TC      | Case                                                                                     | Expected                                        |
  | ------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
  | S1-TC1  | census: keys vs `operationRegistry`                                                      | identical sets                                  |
  | S1-TC2  | void ops                                                                                 | `null`                                          |
  | S1-TC3  | recursive keyword walk over all schemas                                                  | only allowed keywords                           |
  | S1-TC4  | exact schema `cli.ip.addr`                                                               | object, `ipv4Address` required                  |
  | S1-TC5  | exact schema `cli.ip.dhcpc`                                                              | `oneOf` of 4 branches discriminated by `action` |
  | S1-TC6  | exact schema `cli.ip.arp`                                                                | `oneOf` of field-less `action` branches         |
  | S1-TC7  | exact schema `cli.ddns.set`, `cli.dos` (array)                                           | match TS types                                  |
  | S1-TC8  | round-trip: schema-shaped sample → real `buildFrames`                                    | no throw                                        |
  | S1-TC9  | fixture with index signature / `unknown` / heterogeneous tuple / non-object intersection | `InputSchemaGenerationError` with 4 issues      |
  | S1-TC10 | fixture with per-file count mismatch                                                     | throws naming the file                          |
  | S1-TC11 | fixture with positional manifestId mismatch                                              | throws naming file + index                      |
  | S1-TC12 | `inputSchemaFor('unknown.id')`                                                           | `undefined`                                     |

- **Evidence**: 499 files / 2369 tests green; coverage 99.57 % stmts / 94.28 % branches; `manifest:check OK — 472 input schema entries (290 with input, 182 void)`.

### S2 — Close SDK gaps found by the MCP migration · `done` (2026-09-29: +12 manifest entries, 484 ops, 2419 tests green)

- **Business requirement**: BR-4, BR-5.
- **Technical** — add ops (each with manifest entry, parser, tests; classification from the CLI reference, never inferred):

  | Gap                                                         | Evidence                                                                                                     | Change                                                                                                          |
  | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
  | `ip route add/del` (MCP `ip_route_add`, `ip_route_del`)     | CLI ref `ip route` heading; BACKLOG tracked follow-up                                                        | split `cli.ip.route` write sub-forms into new write entries (`add`, `del`; also `default`, `clean` per heading) |
  | `ip arp` write sub-forms                                    | BACKLOG tracked follow-up                                                                                    | new write entries (`add`, `del`, `flush`, …)                                                                    |
  | `ip session` bare form + write sub-forms (MCP `ip_session`) | `vigor3912s-mcp/recon-output/e2e-passed.json` (bare form live-verified); `src/domains/ip.ts` narrowed it out | add `{ action: 'list' }` variant emitting `ip session`; write sub-forms (`on/off/add/del`) as new entries       |
  | `wan detect` write sub-forms                                | BACKLOG tracked follow-up                                                                                    | new write entry (`<wan> on/off/strict/always_on`)                                                               |
  | `ddns show` without `-i` (MCP `ddns_show`)                  | `e2e-passed.json` (bare form live-verified); CLI ref documents only `-i`                                     | make `accountIndex` optional; bare form emits `ddns show`                                                       |

- **Not in S2** (no documented syntax anywhere, no SDK op possible without guessing): `swm tr069`, `local_8021x show_local_cer`, `service get` → owner decision OD-1 in the MCP plan.
- **Acceptance criteria**
  - AC-1 Every change above has a manifest entry with a `citation`, correct `classification`, `status: implemented`.
  - AC-2 Existing inputs keep producing byte-identical frames (additive only).
  - AC-3 Schemas regenerate; census still exact; `manifest:check` green.
  - AC-4 No classification inferred from the command string; ambiguous rows stay `unknown` and are reported.
- **DoD**: `npm run manifest:generate && npm run verify` green; coverage thresholds unchanged or higher; reviewer approve; QA pass; CHANGELOG Unreleased + BACKLOG follow-up closed.
- **Test cases**

  | TC     | Case                                          | Expected                                                                        |
  | ------ | --------------------------------------------- | ------------------------------------------------------------------------------- |
  | S2-TC1 | `ip route add` sample                         | `ip route add <dest> <mask> <gw>` exactly as CLI ref syntax                     |
  | S2-TC2 | `ip route del` sample                         | documented form                                                                 |
  | S2-TC3 | `ip session` list variant                     | frame `ip session`; parser handles `recon-output` sample                        |
  | S2-TC4 | `ddns show` without index                     | frame `ddns show`; with index → unchanged `ddns show -i <n>`                    |
  | S2-TC5 | invalid inputs (bad IPv4, out-of-range index) | `buildFrames` throws                                                            |
  | S2-TC6 | regression: all pre-existing domain tests     | unchanged green                                                                 |
  | S2-TC7 | census after regeneration                     | manifest cli-command count and schema count increase by exactly the new entries |

- **Code structure**: `src/domains/ip.ts`, `src/domains/ddns.ts`, `src/domains/wan.ts`; parsers under `src/internal/parsers/{ip,ddns,wan}/`; tests under `tests/domains/{ip,ddns,wan}/`; regenerated `*.generated.ts`.

### S4 — Unit-test completeness gate (100 % features, ≥ 85 % lines incl. generator) · `done` (2026-09-29; static census superseded by the runtime census in S6)

- **Business requirement**: owner requirement 2026-09-29 — “UTs up to date, cover 100 % features, 85 % code lines”.
- **Baseline (2026-09-29)**: all 472 implemented ops are referenced by at least one test (393 by export name, 79 by manifestId); `src/` coverage 99.57 % lines. `tools/` (manifest + schema generators, ~3 000 lines) is **not measured**; measured with it included, `tools/` is ~30 % lines.
- **Technical**
  1. Feature census test `tests/features/operation-coverage.test.ts`: for every manifestId in the registry, assert a test under `tests/domains/<family>/` references the op (export name or manifestId) **and** that the op's `buildFrames` and `parse` are both exercised (enforced via a per-op case table or a registry of covered ops populated by domain tests — dev picks the lighter mechanism that fails when a new op lands without tests).
  2. Coverage config: include `tools/**/*.ts`; thresholds lines ≥ 85 globally and per-file for `tools/` (keep existing 90 % global `src/` thresholds).
  3. Make the generators testable: export pure functions from `tools/generate-capability-manifest.ts` (CLI-reference heading parser, danger-list overlay, streaming block, classification lookup, WebUI INDEX parser, split handling, write/check artifact) with `main()` a thin wrapper; unit-test each with small fixtures.
- **Acceptance**: AC-1 census fails if any op lacks tests; AC-2 `tools/` ≥ 85 % lines; AC-3 global ≥ 85 % lines (src thresholds unchanged at 90 %); AC-4 generated artifacts byte-identical after refactor (`manifest:check` green).
- **DoD**: `npm run verify` green with the new thresholds; reviewer approve.
- **Test cases**: S4-TC1 census passes on current corpus; S4-TC2 census fails with an injected untested fake op; S4-TC3 heading parser handles the indented `wan vlan` heading; S4-TC4 danger-list overlay marks `sys cfg default` destructive; S4-TC5 streaming commands → `blocked-by-documentation`; S4-TC6 WebUI parser skips AppleDouble `._*` files; S4-TC7 `--check` mode exits non-zero on drift.

- **Progress / handover (2026-09-29)**: `npm run verify` green — 514 files / 2459 tests; coverage 99.06 % stmts / 93.41 % branches / 99.89 % funcs / 99.05 % lines (incl. `tools/`, which is 92.71 % lines); feature census: 484/484 ops referenced by tests; `src/domains/**` + `src/internal/parsers/**` 100 % functions; `manifest:check` exit 1 on drift verified. New: `tests/tools/generate-capability-manifest.test.ts` (37), `tests/tools/import-redacted-fixture.test.ts`, `tests/features/operation-coverage.test.ts`.

### S5 — Review + QA · `skipped` (owner decision 2026-09-29)

- Owner: no review/QA in this flow; completion = all development done + `npm run verify` (UTs) green.

### S6 — Fix findings of the internal SDK audit (H1–L9) · `done` (2026-09-29)

- H1 `ip route clean` / `ip route default` → `destructive`. H2/M3 `ddns show`
  restored to its 1.0.0 contract; bare form is `cli.ddns.show.all` (raw).
  H3 runtime operation census (`tests/support/operation-usage.ts` +
  `tools/check-operation-usage.ts`, part of `npm test`). M1 tuple
  `minItems`/`maxItems` + runtime length checks. M2 numeric bounds read from
  domain validators. M4 original metadata of pre-existing entries kept. M5
  live-only bare forms moved to `live-firmware-recon` entries with an honest
  evidence note. M6 generator `main()` dependencies injectable (tests use
  sources, not `dist/`). M7 generator split into `tools/manifest/*`. L1
  code-point key order. L2 no invented bounds; `ip1 ≤ ip2`; contiguous
  netmask. L3 recursion guard. L4 omittable input with required props fails
  loudly. L5 thin parser wrappers and duplicate builders removed. L6 no
  `as const` in the generated schema module. L7 brittle tests fixed. L8/L9 docs
  (CONTRIBUTING "Domain operations").

### S7 — Fix findings of the external audit (F-3–F-8) · `done` (2026-09-29)

- F-3 hard `commandTimeoutMs` + session invalidation. F-6 optional
  `Transport.stream()` with in-flight `maxOutputBytes`/`idleTimeoutMs`. F-5
  `detectCliRejection` + `command_rejected` in `invoke()`. F-4
  `Transport.remoteEndpoint` bound to the LAN-only policy (re-checked per
  command) + `SessionPolicy` enforced; `connectTimeoutMs` deprecated. F-7
  shared `src/internal/domain-support.ts` (152 copies removed). F-8 `execute()`
  documented as raw/unguarded (JSDoc, SECURITY.md).
- Evidence: `npm run verify` green — 509 files / 2564 tests, operation census
  501/501, coverage 98.9 % lines, 0 vulnerabilities.

### S8 — Sub-form census gate + full documented sub-form coverage (external F-2) · `done` (2026-09-29)

- **Business requirement**: every documented Part VIII syntax form (939 lines
  across 327 headings) is modelled by an operation, or listed with a reason.
- **Technical**: the generator extracts each heading's `Syntax` lines into the
  manifest (`syntaxForms`); every operation declares the forms it covers;
  `manifest:check` fails on an uncovered form unless it is in an explicit
  exclusion list (help `?`, obsolete, streaming). Then implement the missing
  forms family by family with `describeOperation` tests.
- **Acceptance**: uncovered-forms list empty except reasoned exclusions;
  `BACKLOG.md` "100 %" wording replaced by the measured form census.

### S9 — Live-firmware gaps (external F-1) · `done` (2026-09-29)

- ~40 sub-commands present on fw 4.4.7_RC2 but absent from the PDF (`fs`
  format/mkfile/mkdir/rm/ren/cd/cp/cat/test, `vpn` udp/passAPM/dpdkctrl/wg,
  `mngt` ssh_oldkex/acme/lb_interface/NoSecureL2TPM/ValidationCod, `wan`
  dpdk-port/drop/detect2/lbweight/voipdect/phymode, `sys`
  pwenc/halt/con2tel/mpage/ipfix_netflow/cancel, `ip` dnssec/…, `ip6 debug`,
  `ipf` default/hash_analysis, `qos setdefault`, `show ping`, `usb FTPusage`,
  `vlan map`, family `cert`). Syntax must come from read-only `?` recon on the
  router; then live-recon entries + operations + a live-inventory census gate
  against `recon-output/command-inventory/`.

**S8/S9 outcome (2026-09-29):** 640 operations (+50 firmware-only from the
owner's `?` capture, `references/live-help-fw-4.4.7_RC2.txt`, basis
`live-help-syntax`). Sub-form census: 826/845 documented forms covered by
tests, 19 reasoned exclusions (manual misprints, bare-word placeholders,
pointers, usage help, interactive telnet). Live-inventory census: every
fw 4.4.7_RC2 `?` entry mapped; 16 reasoned exclusions (no usage printed:
`cert`, `sys cancel`, `ip dnssec`; name-only listings: `dpdk *`, `csm quic`,
`ip6 debug`; `mngt acme` invalid on the firmware; `sys halt` / `swm tr069`
not captured). Hidden narrowings found by reading the manual and fixed:
`ipf rule` options, `ip6 lan` flags, `ddns set` per-flag update, `ip dhcpc`
option forms. Destructive additions: `fs format`, `fs rm`, `ipf default`,
`qos setdefault`, `wan drop`, `wan phymode`, `vpn dpdkctrl flush`, `vpn wg key
gen/set`, `service -t/-c`, object/`csm local_bw`/`hsportal info` resets.

### S3 — Release 1.1.0 · `backlog` (user-gated)

- **Business requirement**: BR-5.
- **Technical**: `release/1.1.0` from `develop`; version bump; CHANGELOG; README badges; PR → `master`; tag; merge back. Per `.ai/skills/release/SKILL.md`.
- **Acceptance**: tag `v1.1.0` published; `develop` contains the merge-back; MCP CI can clone the SDK ref.
- **DoD**: full-green CI, review comments triaged, no Copilot request, user approved commit/PR/tag.
- **Test cases**: S3-TC1 container `npm ci && npm run verify` on `node:24.21.0-bookworm`; S3-TC2 `npm pack` + installed consumer smoke importing `./schemas`.

## 5. Decision log

| Date       | Decision                                                                               | Options considered                                                                    | Why                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 2026-09-29 | Schemas generated from TS types in the SDK, exported as `./schemas`, zero runtime deps | (a) SDK generates JSON Schema ✔ (b) SDK adopts zod at runtime (c) MCP hand-writes zod | (a) one source of truth, no runtime dep; (b) adds a dep and ~267 hand-written schemas; (c) repeats the drift defect |
| 2026-09-29 | TypeScript compiler API, no new devDependency                                          | ts-json-schema-generator                                                              | `typescript` already a devDep; external generator's TS 6 support unverified                                         |
| 2026-09-29 | `"integer"` kept in `JsonSchema` type although unemitted                               | drop (YAGNI)                                                                          | MCP converter consumes the type; avoids a cross-repo type break                                                     |
| 2026-09-29 | On MCP/SDK command divergence the CLI reference + live evidence decide                 | SDK always wins; ask per case                                                         | user choice; inconclusive cases escalate                                                                            |
