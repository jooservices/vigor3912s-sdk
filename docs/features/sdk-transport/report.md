# SDK Transport Traceability Report

Date: 2026-09-14

Scope: final reporting for the completed public client-facing `Transport` seam
in `projects/vigor3912s/sdk`. This report maps `REQ-SDK-1` through `REQ-SDK-6`
to implementation, tests, review disposition, and QA evidence. It does not
declare overall project completion; final acceptance remains with the root/user
gate.

## Evidence Basis

- Approved architecture: `ARCHITECTURE.md` requires a public `Transport`
  interface for a separate client package and explicitly excludes SSH, client
  package dependencies, and MCP concerns from this SDK
  (`ARCHITECTURE.md:10`).
- Approved requirement set: `HANDOVER.md` records `REQ-SDK-1` through
  `REQ-SDK-6` and their DoD (`HANDOVER.md:174`-`HANDOVER.md:186`).
- Wave 5 status: `BACKLOG.md` records Wave 5 complete, T5.1/T5.3/T5.5 accepted,
  T5.2/T5.4/T5.6 accepted, and final SDK evidence (`BACKLOG.md:154`-
  `BACKLOG.md:175`).
- Source/test spot-checks were performed against the public export, client
  injection, transport JSDoc, fake transport, live read-only safety remediation,
  and package entrypoint tests listed below.
- Missing local phase ledgers: no `docs/features/*/{business,architecture,
implementation,findings,qa}.md` files were present under the SDK tree at
  report time. This report therefore uses the approved `HANDOVER.md`,
  `BACKLOG.md`, `ARCHITECTURE.md`, source/tests, and the root-supplied closed
  gate handoff as evidence.

## Requirement Traceability

| Requirement                                      | Task | Implementation evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Test evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                | Review / QA evidence                                                                                                                                                                                                                                            |
| ------------------------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REQ-SDK-1` Public `Transport` contract          | T5.1 | `package.json` exports `./transport` to `dist/transport/index.{d.ts,js}` (`package.json:21`-`package.json:24`); `src/transport/index.ts` re-exports `Transport`, exchange types, `CommandFrame`, and `ExecutionLimits` without exposing framing helpers (`src/transport/index.ts:18`-`src/transport/index.ts:24`).                                                                                                                                                                           | Source subpath import and type-level contract checks are covered in `tests/transport/public-exports.test.ts:13`-`tests/transport/public-exports.test.ts:53`; built package subpath import is covered in `tests/package-entrypoint.test.js:35`-`tests/package-entrypoint.test.js:39`; internal subpath rejection is covered in `tests/package-entrypoint.test.js:29`-`tests/package-entrypoint.test.js:33`.                                                   | Backlog records T5.1 accepted and build emission of `dist/transport/{index.d.ts,index.js}` (`BACKLOG.md:158`, `BACKLOG.md:168`). Container QA passed `npm run verify`, `npm pack --dry-run`, and installed package smoke per root handoff and `BACKLOG.md:175`. |
| `REQ-SDK-2` Documented `Transport` semantics     | T5.2 | The public interface documents one-frame/one-exchange semantics, `AbortSignal`, limits, `isOpen`, and `close(reason)` (`src/internal/execution/transport.ts:21`-`src/internal/execution/transport.ts:49`). `docs/transport.md` documents public import, one exchange per frame, no shell chaining, `ExecutionLimits`, `AbortSignal`, `isOpen`, `close`, DrayOS prompt/pager responsibilities, and no fabricated exit codes (`docs/transport.md:3`-`docs/transport.md:81`).                   | Public type usability is checked in `tests/transport/public-exports.test.ts:23`-`tests/transport/public-exports.test.ts:53`. Timeout/output-limit behavior through the runner envelope is checked in `tests/live/live-read-only-client.test.ts:318`-`tests/live/live-read-only-client.test.ts:363`.                                                                                                                                                          | Backlog records T5.2 accepted via final `npm run verify` (`BACKLOG.md:160`, `BACKLOG.md:169`). Residual F-2 risk is documented: implementors must honor `AbortSignal` (`BACKLOG.md:162`; `HANDOVER.md:129`-`HANDOVER.md:134`).                                  |
| `REQ-SDK-3` First-class `Transport` injection    | T5.3 | `Vigor3912SClient.fromTransport(transport)` constructs the existing `DefaultCommandRunner` from an injected `Transport` while keeping zero-arg behavior unchanged (`src/client.ts:35`-`src/client.ts:44`). `execute()` delegates to the injected runner when present and otherwise fails closed (`src/client.ts:46`-`src/client.ts:59`).                                                                                                                                                     | `tests/client-from-transport.test.ts:7`-`tests/client-from-transport.test.ts:24` proves successful `execute()` round-trip through `FakeTransport` and `session_closed` behavior when pre-closed. Built package runner injection and unchanged no-runner rejection are covered in `tests/package-entrypoint.test.js:42`-`tests/package-entrypoint.test.js:64`.                                                                                                | Backlog records T5.3 accepted, additive behavior unchanged, and no SSH/client import (`BACKLOG.md:158`, `BACKLOG.md:170`).                                                                                                                                      |
| `REQ-SDK-4` Reference fake                       | T5.4 | `FakeTransport` is deterministic, in-memory, implements the transport shape, records calls, supports queued responses/responder functions, honors pre-aborted sends, and closes by toggling `isOpen` (`tests/support/fake-transport.ts:1`-`tests/support/fake-transport.ts:83`). `docs/transport.md` identifies it as a test/reference implementation only, not production wire code (`docs/transport.md:74`-`docs/transport.md:81`).                                                        | Type-level compatibility of `FakeTransport` with public `Transport` is checked in `tests/transport/public-exports.test.ts:23`-`tests/transport/public-exports.test.ts:29`. The public injection test uses it for runner round-trip (`tests/client-from-transport.test.ts:7`-`tests/client-from-transport.test.ts:14`).                                                                                                                                       | Backlog records T5.4 accepted and clarifies test/reference-only status (`BACKLOG.md:160`, `BACKLOG.md:171`).                                                                                                                                                    |
| `REQ-SDK-5` Stable transport-related error codes | T5.5 | `sdkErrorCodes` exports `execution_timeout`, `output_limit_exceeded`, `session_closed`, plus the related framing/change/live codes (`src/errors.ts:1`-`src/errors.ts:9`). `DefaultCommandRunner` raises those codes for timeout, output overflow, command-size rejection, and closed transport (`src/internal/execution/default-runner.ts:22`-`src/internal/execution/default-runner.ts:41`, `src/internal/execution/default-runner.ts:109`-`src/internal/execution/default-runner.ts:133`). | `session_closed` is asserted through public injection in `tests/client-from-transport.test.ts:16`-`tests/client-from-transport.test.ts:24`; timeout and output-overflow codes are asserted through `LiveReadOnlyClient.invoke()` in `tests/live/live-read-only-client.test.ts:318`-`tests/live/live-read-only-client.test.ts:363`; package root keeps `sdkErrorCodes` public in `tests/package-entrypoint.test.js:18`-`tests/package-entrypoint.test.js:27`. | Backlog records T5.5 accepted and error-code assertion against real failure paths (`BACKLOG.md:158`, `BACKLOG.md:172`).                                                                                                                                         |
| `REQ-SDK-6` Docs / metadata honesty              | T5.6 | README states the SDK provides typed CLI operations and public `Transport` injection but does not ship SSH, live connections, MCP adapters, or registry parity work (`README.md:3`-`README.md:16`). Public surface includes `fromTransport` and the `./transport` type exports (`README.md:18`-`README.md:44`). `sdkMetadata.status` is `cli-operations-implemented` (`src/index.ts:8`-`src/index.ts:16`).                                                                                   | Built package entrypoint asserts `sdkMetadata.status`, fail-closed zero-arg behavior, no `CommandRunner` export, and `./transport` export shape (`tests/package-entrypoint.test.js:13`-`tests/package-entrypoint.test.js:39`).                                                                                                                                                                                                                               | Backlog records T5.6 accepted and docs/metadata honesty (`BACKLOG.md:160`, `BACKLOG.md:173`).                                                                                                                                                                   |

## Safety Remediation Traceability

- `LiveReadOnlyClient` now uses canonical `capabilityManifest` and
  `operationRegistry` imports rather than caller-supplied manifest/registry
  objects (`src/live/live-read-only-client.ts:49`-`src/live/live-read-only-client.ts:58`,
  `src/live/live-read-only-client.ts:206`-`src/live/live-read-only-client.ts:240`).
- It dispatches accepted read-only operations through `DefaultCommandRunner`,
  preserving the bounded runner envelope (`src/live/live-read-only-client.ts:141`-
  `src/live/live-read-only-client.ts:151`, `src/live/live-read-only-client.ts:176`-
  `src/live/live-read-only-client.ts:187`).
- Guard failures reject before touching transport `send`/`isOpen`/`close` in the
  test suite (`tests/live/live-read-only-client.test.ts:112`-
  `tests/live/live-read-only-client.test.ts:214`).
- Forged caller-provided manifest/registry objects are ignored; the test proves
  a forged `sys reboot` frame cannot dispatch (`tests/live/live-read-only-client.test.ts:288`-
  `tests/live/live-read-only-client.test.ts:315`).
- The public live surface remains limited to `invoke` and `listOperationIds`,
  with type-level checks that `execute`, runner, and transport accessors are not
  exposed (`tests/live/live-read-only-client.test.ts:218`-
  `tests/live/live-read-only-client.test.ts:272`).
- Backlog/Handover state that reviewer findings F-1, F-3, and F-4 were verified
  fixed; the root task also states F-5 was verified fixed. No standalone
  `findings.md` ledger was present locally, so this report cannot add
  independent finding-by-finding reviewer quotations beyond the source/test
  evidence above and the closed-gate handoff.

## QA And Verification

Reported closed-gate QA evidence:

- Independent QA ran in `node:24.21.0-bookworm` with npm 12.0.2 and passed
  `npm ci`, `npm run verify`, `npm pack --dry-run`, installed package
  root/`./transport`/`./live` consumer smoke, and internal subpath rejection.
- `npm run verify` passed with 494 files / 2346 tests.
- `manifest:check` passed with 649 entries: 478 CLI + 171 WebUI.
- Registry evidence: 472 operations across 42 domain modules.
- Coverage evidence: 99.59% statements, 99.59% lines, 99.94% functions, 94.28%
  branches; all global thresholds are at least 90% (`vitest.config.ts:31`-
  `vitest.config.ts:36`).
- `npm audit --audit-level=moderate` reported 0 vulnerabilities.

Reporter-local verification:

- Source and test evidence above was inspected directly.
- Report formatting was checked with Prettier after writing this file.

## Residual Risks / Missing Evidence

- No live E2E was run or authorized. This is consistent with the approved scope:
  live router connection, SSH, `.env`, host-key pinning, and MCP work are outside
  this SDK package (`HANDOVER.md:146`-`HANDOVER.md:153`,
  `HANDOVER.md:195`-`HANDOVER.md:201`).
- F-2 remains a real cooperative-timeout risk: the SDK passes `AbortSignal` and
  enforces runner timeouts, but a concrete `Transport` implementor must actually
  honor the signal. This is documented in `docs/transport.md:40`-
  `docs/transport.md:47` and recorded by the closed-gate handoff.
- No per-feature `findings.md` or `qa.md` ledger was found in the SDK tree. The
  review/QA status in this report therefore depends on `HANDOVER.md`,
  `BACKLOG.md`, and the root-supplied handoff, plus direct source/test
  inspection.
- Optional future work remains outside this report: WebUI TypedOperations, live
  E2E with separate authorization, optional heading-split enrichment, and a
  separate SSH client/consumer-side adapter (`HANDOVER.md:146`-`HANDOVER.md:153`).
