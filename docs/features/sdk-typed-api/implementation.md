# Implementation plan — Public Typed Operations API (HANDOVER.md §6c)

> **Superseded 2026-09-14:** Tasks that mandate `ChangePlan` / `denyAllVerifier` /
> `createChangePlan` / `executeChangePlan` no longer match the code. Typed writes
> use `invoke()`; policy is consumer-owned. See `ARCHITECTURE.md` Item 2 amendment.

**Scope:** expose the 472 typed CLI operations through a public SDK API for direct consumer use.

**Approved decisions carried forward:**

1. Add public subpath `@jooservices/vigor3912s-sdk/operations` that re-exports all 472 typed operations grouped by per-family namespace, e.g. `operations.wan.wanStatus`, plus input/output types.
2. Add `Vigor3912SClient.invoke(operation, input, options?)`.
   - It authenticates the descriptor against the canonical registry/manifest.
   - It rejects forged descriptors, including same-`manifestId` non-canonical objects.
   - It dispatches through the existing bounded `DefaultCommandRunner`.
3. Typed write/destructive operations use the ChangePlan path only:
   - `client.createChangePlan(op, input, meta)` builds a `ChangePlan`.
   - `client.executeChangePlan(plan)` runs verifier chain in order: `authorize → backup → verifyReplay → verify`.
   - Default verifier is `denyAllVerifier`, so no typed write reaches runner unless a real verifier is injected.
   - Replace `UnwiredTypedWriteExecutor` with `DefaultTypedWriteExecutor` wired to `DefaultCommandRunner`.
4. Preserve safety boundary: no SSH / `ssh2`, no MCP, no live router / `.env`, no registry hand-edits, no semantic changes to `src/domains/*.ts`, no weakening `execute()` one-command framing, no weakening ChangePlan gate.
5. Root decision 2026-09-14: `executeChangePlan()` returns `Promise<void>` (unchanged `TypedWriteExecutor` contract in the closed architecture; no write-output parsing).

---

## Requirements and acceptance criteria

| Requirement                                    | Acceptance criteria                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REQ-TYPED-1` Public operations subpath        | `AC-1.1` `./operations` is exported in `package.json` and build emits JS + d.ts. `AC-1.2` Runtime import exposes per-family namespaces. `AC-1.3` Type imports preserve each operation input/output type.                                                                                                                                                   |
| `REQ-TYPED-2` Public typed descriptor contract | `AC-2.1` Public `TypedOperation<TInput, TOutput>` is importable from `./operations`. `AC-2.2` Descriptor uses `CommandFrame`, `CommandExchange`, and `ExecutionLimits`, not stale `unknown` placeholders.                                                                                                                                                  |
| `REQ-TYPED-3` Typed read invocation            | `AC-3.1` Canonical read operation dispatches through bounded runner. `AC-3.2` `executionOverride` is honored. `AC-3.3` Parsed output type is returned.                                                                                                                                                                                                     |
| `REQ-TYPED-4` Forgery/write rejection          | `AC-4.1` Forged same-`manifestId` descriptor is rejected with `forged_operation_rejected`. `AC-4.2` Write/destructive descriptors passed to `invoke()` are rejected with `typed_write_requires_change_plan`.                                                                                                                                               |
| `REQ-TYPED-5` ChangePlan typed write path      | `AC-5.1` `createChangePlan()` builds frames via `buildFrames`. `AC-5.2` `ChangePlanFrame` is real `CommandFrame`. `AC-5.3` `executeChangePlan()` runs verifier chain in order before dispatch. `AC-5.4` default `denyAllVerifier` rejects before dispatch. `AC-5.5` `DefaultTypedWriteExecutor` dispatches verified frames through `DefaultCommandRunner`. |
| `REQ-TYPED-6` Docs/package honesty + QA        | `AC-6.1` README/HANDOVER/BACKLOG/docs describe public typed API and safety boundary honestly. `AC-6.2` Final native gate and isolated container QA pass.                                                                                                                                                                                                   |

---

## Traceability table

| REQ / AC                      | Task           | Tests                                                                                                                                       |
| ----------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `REQ-TYPED-1` / `AC-1.1..1.3` | Task 3         | `tests/operations/public-operations-subpath.test.ts`, `tests/package-entrypoint.test.js`                                                    |
| `REQ-TYPED-2` / `AC-2.1..2.2` | Task 2, Task 3 | `tests/registry/typed-operation-contract.test.ts`, `tests/operations/public-operations-subpath.test.ts`                                     |
| `REQ-TYPED-3` / `AC-3.1..3.3` | Task 4         | `tests/client-invoke.test.ts`                                                                                                               |
| `REQ-TYPED-4` / `AC-4.1..4.2` | Task 1, Task 4 | `tests/errors/public-error-codes.test.ts`, `tests/client-invoke.test.ts`                                                                    |
| `REQ-TYPED-5` / `AC-5.1..5.5` | Task 5, Task 6 | `tests/change-plan/change-plan-frame.test.ts`, `tests/change-plan/default-typed-write-executor.test.ts`, `tests/client-change-plan.test.ts` |
| `REQ-TYPED-6` / `AC-6.1..6.2` | Task 7, Task 8 | `npm run verify`, container QA smoke                                                                                                        |

---

# Wave A — Public types, errors, and operations export

Parallel allowed: Task 1 and Task 2 may run together. Task 3 waits for Task 2.

## Task 1: Add public typed-operation safety error codes

**Traceability:** `REQ-TYPED-4` / `AC-4.1`, `AC-4.2` → this task → `tests/errors/public-error-codes.test.ts`
**Assigned to:** `joo-dev_1 · openai/gpt-5.5`
**Status:** backlog
**Review:**
**QA:** pending

**Description:** Add stable SDK error codes for public typed API rejection paths so `client.invoke()` and ChangePlan code can fail predictably without inventing local error strings.

**Scope:**

- Add codes to `src/errors.ts`.
- Add focused public-code tests.

**Do NOT:**

- Do NOT add SSH / `ssh2`.
- Do NOT add MCP.
- Do NOT touch live client.
- Do NOT hand-edit generated registry files.
- Do NOT commit/push/`gh`.
- Do NOT change `src/domains/*.ts`.

**Implementation steps:**

1. Edit `src/errors.ts`.
2. Extend `sdkErrorCodes`:
   ```ts
   forgedOperationRejected: "forged_operation_rejected",
   typedWriteRequiresChangePlan: "typed_write_requires_change_plan",
   ```
3. Keep `SdkErrorCode` derived from `sdkErrorCodes`.
4. Add `tests/errors/public-error-codes.test.ts`:
   - asserts both keys exist
   - asserts values are exact strings
   - asserts `new Vigor3912SError(sdkErrorCodes.forgedOperationRejected, "...").code`

**Acceptance criteria:**

- [ ] `sdkErrorCodes.forgedOperationRejected === "forged_operation_rejected"`.
- [ ] `sdkErrorCodes.typedWriteRequiresChangePlan === "typed_write_requires_change_plan"`.
- [ ] No existing error code changes.

**NFR:** Security: rejection errors must not include command stdout/stderr or secrets.

**Verification:**

```bash
cd projects/vigor3912s/sdk
npm run format:check && npm run lint && npm run typecheck && npm test
```

**Tests to write:**

- `tests/errors/public-error-codes.test.ts`

**Dependencies:** None

**Files likely touched:**

- `src/errors.ts`
- `tests/errors/public-error-codes.test.ts`

**Write scope (touches):**

- `src/errors.ts`
- `tests/errors/public-error-codes.test.ts`

**Provides / requires:**

- Provides `sdkErrorCodes.forgedOperationRejected`
- Provides `sdkErrorCodes.typedWriteRequiresChangePlan`
- Requires none

**Risks / rollback:** Low. Revert `src/errors.ts` additions and test file.

**DoD:** Format/lint/typecheck/test green. No unrelated error hierarchy added.

**Ask for help when:**

- Existing tests assert an exact list of error-code keys and fail unexpectedly.
- A new error class seems necessary; prefer `Vigor3912SError` unless root approves.

**Progress / handover:**

- [ ] Completed:
- [ ] Next step:
- [ ] Blocked (needed from whom):
- On disk:

---

## Task 2: Tighten `TypedOperation` to real execution types

**Traceability:** `REQ-TYPED-2` / `AC-2.2` → this task → `tests/registry/typed-operation-contract.test.ts`
**Assigned to:** `joo-dev_2 · openai/gpt-5.5`
**Status:** backlog
**Review:**
**QA:** pending

**Description:** Replace stale `unknown` descriptor placeholders with the real `CommandFrame`, `CommandExchange`, and `ExecutionLimits` types now present after Lane C.

**Scope:**

- Tighten `src/internal/registry/operation.ts`.
- Update mechanical casts only if typecheck requires it.
- Live client behavior must remain identical.

**Do NOT:**

- Do NOT change operation semantics in `src/domains/*.ts`.
- Do NOT edit generated registry files.
- Do NOT change manifest generation.
- Do NOT change live client guards or allowed ids.
- Do NOT add SSH / MCP / live E2E.
- Do NOT commit/push/`gh`.

**Implementation steps:**

1. Edit `src/internal/registry/operation.ts`.
2. Import types:
   ```ts
   import type { CommandFrame } from "../execution/framing.js";
   import type { ExecutionLimits } from "../execution/limits.js";
   import type { CommandExchange } from "../execution/transport.js";
   ```
3. Change interface:
   ```ts
   export interface TypedOperation<TInput, TOutput> {
     readonly manifestId: string;
     readonly classification: OperationClassification;
     readonly buildFrames: (input: TInput) => readonly CommandFrame[];
     readonly parse: (exchanges: readonly CommandExchange[]) => TOutput;
     readonly executionOverride?: Partial<ExecutionLimits>;
   }
   ```
4. Keep:
   ```ts
   export type OperationRegistry = ReadonlyMap<string, TypedOperation<never, unknown>>;
   ```
5. Update `src/internal/registry/self-assembly.ts` only if typecheck requires it; do not change behavior.
6. Update `src/live/live-read-only-client.ts` only for mechanical cast removal (e.g. redundant `as readonly CommandFrame[]`, `as Partial<ExecutionLimits>`); keep behavior and guards identical.
7. Remove the stale module doc-comment block in `operation.ts` that says execution types do not exist yet.
8. Add `tests/registry/typed-operation-contract.test.ts`:
   - compile/runtime smoke using a small local `TypedOperation<void, string>`
   - `buildFrames()` returns `CommandFrame[]`
   - `parse()` accepts `CommandExchange[]`
   - `executionOverride` accepts `Partial<ExecutionLimits>`

**Acceptance criteria:**

- [ ] `TypedOperation` no longer exposes `unknown[]` in `buildFrames`/`parse`.
- [ ] Existing 472 operations typecheck unchanged in behavior.
- [ ] Live client tests remain behavior-identical.

**NFR:** Maintainability: remove stale TODO/comments that say execution types do not exist.

**Verification:**

```bash
cd projects/vigor3912s/sdk
npm run format:check && npm run lint && npm run typecheck && npm test
```

**Tests to write:**

- `tests/registry/typed-operation-contract.test.ts`

**Dependencies:** None

**Files likely touched:**

- `src/internal/registry/operation.ts`
- `src/internal/registry/self-assembly.ts` only if needed
- `src/live/live-read-only-client.ts` only mechanical casts if needed
- `tests/registry/typed-operation-contract.test.ts`

**Write scope (touches):**

- `src/internal/registry/operation.ts`
- `src/internal/registry/self-assembly.ts`
- `src/live/live-read-only-client.ts`
- `tests/registry/typed-operation-contract.test.ts`

**Provides / requires:**

- Provides real typed `TypedOperation<TInput, TOutput>`
- Requires existing execution types

**Risks / rollback:** Medium because all domains depend on this type. Revert type changes if broad semantic edits become necessary.

**DoD:** Full wave checkpoint green. No domain operation behavior changes. No live guard behavior changes.

**Ask for help when:**

- More than mechanical cast cleanup is needed in `src/live/live-read-only-client.ts`.
- Any `src/domains/*.ts` semantic change appears necessary.

**Progress / handover:**

- [ ] Completed:
- [ ] Next step:
- [ ] Blocked (needed from whom):
- On disk:

---

## Task 3: Generate and export public `./operations` namespace

**Traceability:** `REQ-TYPED-1` / `AC-1.1..1.3`, `REQ-TYPED-2` / `AC-2.1` → this task → `tests/operations/public-operations-subpath.test.ts`
**Assigned to:** `joo-dev_3 · openai/gpt-5.5`
**Status:** backlog
**Review:**
**QA:** pending

**Description:** Add a public `@jooservices/vigor3912s-sdk/operations` subpath that exports all existing domain operation descriptors grouped by family namespace without manually maintaining a 472-item barrel.

**Scope:**

- Extend generator to render `src/operations/index.ts`.
- Add package export.
- Export public descriptor types from this subpath.
- Do not change operation implementations.

**Do NOT:**

- Do NOT hand-edit `src/internal/registry/registry.generated.ts`.
- Do NOT hand-edit generated operations barrel after generator owns it.
- Do NOT change `src/domains/*.ts` semantics.
- Do NOT add SSH / MCP / live code.
- Do NOT commit/push/`gh`.

**Implementation steps:**

1. Edit `tools/generate-capability-manifest.ts`.
2. Add generation for `src/operations/index.ts` with header:
   ```ts
   /**
    * GENERATED FILE — do not hand-edit.
    * Produced by tools/generate-capability-manifest.ts.
    */
   ```
3. For every `src/domains/<family>.ts`, render namespace import:
   ```ts
   import * as wan from "../domains/wan.js";
   ```
4. Render public object:
   ```ts
   export const operations = {
     wan,
     // ...
   } as const;
   ```
   Use valid identifier mapping for filenames like `local_8021x` → `local_8021x`.
5. Re-export public types:
   ```ts
   export type { TypedOperation, OperationClassification } from "../internal/registry/operation.js";
   export type { CommandExchange } from "../internal/execution/transport.js";
   export type { CommandFrame } from "../internal/execution/framing.js";
   export type { ExecutionLimits } from "../internal/execution/limits.js";
   ```
6. Ensure the generated namespace exposes individually named operation exports and type exports from each domain module.
7. Edit `package.json`:
   ```json
   "./operations": {
     "types": "./dist/operations/index.d.ts",
     "import": "./dist/operations/index.js"
   }
   ```
8. Run `npm run manifest:generate` during implementation to produce `src/operations/index.ts` (and the registry); `manifest:check` must stay green.
9. Add `tests/operations/public-operations-subpath.test.ts`:
   - imports `operations` from `../src/operations/index.js`
   - asserts `operations.wan.wanStatus.manifestId === "cli.wan.status"`
   - asserts type smoke with `import type { TypedOperation } from "../src/operations/index.js"`
10. Extend `tests/package-entrypoint.test.js`:
    - dynamic import `@jooservices/vigor3912s-sdk/operations`
    - assert runtime namespace exists
    - assert representative operation exists
11. Do not modify `src/domains/*.ts`.

**Acceptance criteria:**

- [ ] `@jooservices/vigor3912s-sdk/operations` imports from built package.
- [ ] `operations.<family>.<operation>` exists for representative families.
- [ ] Public `TypedOperation` type is importable from subpath.
- [ ] Generated barrel has no manual drift: `npm run manifest:check` passes.

**NFR:** DRY: generator owns the barrel to avoid a shared hand-maintained 472-export file.

**Verification:**

```bash
cd projects/vigor3912s/sdk
npm run manifest:generate
npm run format:check && npm run lint && npm run typecheck && npm test && npm run manifest:check
```

**Tests to write:**

- `tests/operations/public-operations-subpath.test.ts`
- extend `tests/package-entrypoint.test.js`

**Dependencies:** Task 2

**Files likely touched:**

- `tools/generate-capability-manifest.ts`
- `src/operations/index.ts` generated
- `package.json`
- `tests/operations/public-operations-subpath.test.ts`
- `tests/package-entrypoint.test.js`

**Write scope (touches):**

- `tools/generate-capability-manifest.ts`
- `src/operations/index.ts`
- `package.json`
- `tests/operations/public-operations-subpath.test.ts`
- `tests/package-entrypoint.test.js`

**Provides / requires:**

- Provides public `./operations`
- Provides `operations` runtime namespace
- Requires tightened `TypedOperation` from Task 2

**Risks / rollback:** Medium: package export and generator drift. Roll back package export and generated file if generator cannot stay deterministic.

**DoD:** `manifest:generate` creates deterministic output. `manifest:check` passes. Built package subpath import passes.

**Ask for help when:**

- Generator would need to parse operation names from source text instead of module exports.
- Any domain semantic edit seems necessary.

**Progress / handover:**

- [ ] Completed:
- [ ] Next step:
- [ ] Blocked (needed from whom):
- On disk:

---

## Wave A checkpoint

```bash
cd projects/vigor3912s/sdk
npm run format:check && npm run lint && npm run typecheck && npm run build && npm test && npm run manifest:check
```

---

# Wave B — Typed read invocation

## Task 4: Add `Vigor3912SClient.invoke()` for canonical read operations

**Traceability:** `REQ-TYPED-3` / `AC-3.1..3.3`, `REQ-TYPED-4` / `AC-4.1..4.2` → this task → `tests/client-invoke.test.ts`
**Assigned to:** `joo-dev_4 · openai/gpt-5.5`
**Status:** backlog
**Review:**
**QA:** pending

**Description:** Add the public typed read dispatch method that accepts only canonical registry descriptors and rejects forged/write/destructive operations.

**Scope:**

- Add `invoke<TInput, TOutput>()` to `src/client.ts`.
- Use canonical `operationRegistry`.
- Dispatch frames through existing runner.
- Preserve raw `execute()` behavior.

**Do NOT:**

- Do NOT route raw `execute()` through ChangePlan.
- Do NOT allow writes/destructive operations through `invoke()`.
- Do NOT add SSH / `ssh2`.
- Do NOT touch live client.
- Do NOT hand-edit generated registry.
- Do NOT change domains semantics.
- Do NOT commit/push/`gh`.

**Implementation steps:**

1. Edit `src/client.ts`.
2. Import:
   ```ts
   import { Vigor3912SError, sdkErrorCodes, OperationNotImplementedError } from "./errors.js";
   import type { TypedOperation } from "./internal/registry/operation.js";
   import { operationRegistry } from "./internal/registry/registry.generated.js";
   import type { CommandExchange } from "./internal/execution/transport.js";
   import type { ExecutionLimits } from "./internal/execution/limits.js";
   ```
3. Add method signature:
   ```ts
   public async invoke<TInput, TOutput>(
     operation: TypedOperation<TInput, TOutput>,
     input: TInput,
     options?: ExecuteOptions,
   ): Promise<TOutput>
   ```
4. In `invoke()`:
   - If `#runner` is undefined, reject with `OperationNotImplementedError` (same message style as `execute()`).
   - Resolve canonical descriptor:
     ```ts
     const canonical = operationRegistry.get(operation.manifestId);
     if (canonical !== operation) throw new Vigor3912SError(sdkErrorCodes.forgedOperationRejected, ...)
     ```
   - If `operation.classification !== "read"`, throw `Vigor3912SError(sdkErrorCodes.typedWriteRequiresChangePlan, ...)` with a message directing to `createChangePlan()`/`executeChangePlan()`.
   - Build frames: `const frames = operation.buildFrames(input);`
   - For each frame, dispatch via the runner honoring `executionOverride`:
     - Use a narrow private type guard for `runWithOverride` on the runner (do not widen the public `CommandRunner` contract):
       ```ts
       interface OverrideRunner extends CommandRunner {
         runWithOverride(
           command: string,
           override: Partial<ExecutionLimits>,
           options?: ExecuteOptions,
         ): Promise<CommandResult>;
       }
       ```
     - If the runner has `runWithOverride`, call it with `operation.executionOverride ?? {}` and `options`; otherwise call `run(frame.command, options)`.
   - Collect exchanges and return `operation.parse(exchanges)`.
5. Add `tests/client-invoke.test.ts`:
   - canonical read operation (e.g. `operations.wan.wanStatus`) dispatches through `FakeTransport` and parses
   - forged object with same `manifestId` rejects `{ code: "forged_operation_rejected" }`
   - write operation rejects `{ code: "typed_write_requires_change_plan" }`
   - destructive operation rejects same code
   - operation with `executionOverride` sends raised limit through the runner (assert via fake transport call records)
   - no runner rejects `OperationNotImplementedError`
   - closed transport round-trip rejects `{ code: "session_closed" }`

**Acceptance criteria:**

- [ ] Canonical read operations dispatch and parse.
- [ ] Forged descriptor is rejected by object identity, not just `manifestId`.
- [ ] Write/destructive operations cannot be invoked directly.
- [ ] `executionOverride` reaches `DefaultCommandRunner.runWithOverride`.

**NFR:** Security: reject forged descriptors before any frame dispatch.

**Verification:**

```bash
cd projects/vigor3912s/sdk
npm run format:check && npm run lint && npm run typecheck && npm test
```

**Tests to write:**

- `tests/client-invoke.test.ts`

**Dependencies:** Task 1, Task 2, Task 3

**Files likely touched:**

- `src/client.ts`
- `tests/client-invoke.test.ts`

**Write scope (touches):**

- `src/client.ts`
- `tests/client-invoke.test.ts`

**Provides / requires:**

- Provides `Vigor3912SClient.invoke<TInput, TOutput>()`
- Requires public operations export and error codes

**Risks / rollback:** Medium. Main risk is `CommandRunner` lacking `runWithOverride`; use a narrow type guard without widening public runner.

**DoD:** Typed read path covered. Direct write path blocked. Raw `execute()` tests unchanged.

**Ask for help when:**

- Supporting `executionOverride` would require changing `CommandRunner` public contract.
- Any forged descriptor can reach transport.

**Progress / handover:**

- [ ] Completed:
- [ ] Next step:
- [ ] Blocked (needed from whom):
- On disk:

---

## Wave B checkpoint

```bash
cd projects/vigor3912s/sdk
npm run format:check && npm run lint && npm run typecheck && npm run build && npm test && npm run manifest:check
```

---

# Wave C — ChangePlan typed write/destructive path

## Task 5: Replace unwired write executor with runner-wired `DefaultTypedWriteExecutor`

**Traceability:** `REQ-TYPED-5` / `AC-5.2`, `AC-5.5` → this task → `tests/change-plan/default-typed-write-executor.test.ts`
**Assigned to:** `joo-dev_5 · openai/gpt-5.5`
**Status:** backlog
**Review:**
**QA:** pending

**Description:** Close the old TODO by using real `CommandFrame` in `ChangePlan` and replace `UnwiredTypedWriteExecutor` with an executor backed by `DefaultCommandRunner`.

**Scope:**

- Tighten `ChangePlanFrame`.
- Add `DefaultTypedWriteExecutor`.
- Update tests referencing `UnwiredTypedWriteExecutor`.

**Do NOT:**

- Do NOT weaken `VerifiedChangePlan` branding.
- Do NOT make `denyAllVerifier` permissive.
- Do NOT add real verifier.
- Do NOT add SSH/MCP/live connection.
- Do NOT edit domains semantics.
- Do NOT commit/push/`gh`.

**Implementation steps:**

1. Edit `src/internal/change-plan/change-plan.ts`.
2. Replace `export type ChangePlanFrame = string;` with:
   ```ts
   import type { CommandFrame } from "../execution/framing.js";
   export type ChangePlanFrame = CommandFrame;
   ```
3. Remove the obsolete `TODO(C2)` text.
4. Remove `UnwiredTypedWriteExecutor`.
5. Add:
   ```ts
   import { DefaultCommandRunner } from "../execution/default-runner.js";

   export class DefaultTypedWriteExecutor implements TypedWriteExecutor {
     readonly #runner: DefaultCommandRunner;

     public constructor(runner: DefaultCommandRunner) {
       this.#runner = runner;
     }

     public async execute(plan: VerifiedChangePlan): Promise<void> {
       for (const frame of plan.frames) {
         await this.#runner.runWithOverride(frame.command, {});
       }
     }
   }
   ```
6. Update existing tests referencing the old class (search `UnwiredTypedWriteExecutor` under `tests/`) to `DefaultTypedWriteExecutor` with a `FakeTransport`-backed `DefaultCommandRunner`.
7. Add `tests/change-plan/change-plan-frame.test.ts`:
   - `frames` accepts `CommandFrame[]` built by `frameSingleCommand`
8. Add `tests/change-plan/default-typed-write-executor.test.ts`:
   - verified plan with one frame dispatches command through fake transport
   - multi-frame plan dispatches in order
   - executor accepts only `VerifiedChangePlan` (compile-time caveat covered by existing unforgeability tests)
   - closed transport rejects with `{ code: "session_closed" }`

**Acceptance criteria:**

- [ ] `ChangePlan.frames` are `readonly CommandFrame[]`.
- [ ] `UnwiredTypedWriteExecutor` no longer exists.
- [ ] `DefaultTypedWriteExecutor` dispatches via `DefaultCommandRunner`.

**NFR:** Safety: executor accepts only `VerifiedChangePlan`.

**Verification:**

```bash
cd projects/vigor3912s/sdk
npm run format:check && npm run lint && npm run typecheck && npm test
```

**Tests to write/update:**

- `tests/change-plan/change-plan-frame.test.ts`
- `tests/change-plan/default-typed-write-executor.test.ts`
- update existing change-plan tests referencing `UnwiredTypedWriteExecutor`

**Dependencies:** Task 2

**Files likely touched:**

- `src/internal/change-plan/change-plan.ts`
- `tests/change-plan/**`

**Write scope (touches):**

- `src/internal/change-plan/change-plan.ts`
- `tests/change-plan/**`

**Provides / requires:**

- Provides `DefaultTypedWriteExecutor`
- Provides real `ChangePlanFrame`
- Requires real `CommandFrame`

**Risks / rollback:** Medium. Existing tests expect old class. Roll back executor rename only if branding cannot be preserved.

**DoD:** ChangePlan tests pass. No raw write dispatch without verified plan.

**Ask for help when:**

- A public way to mint `VerifiedChangePlan` seems necessary.
- Test changes require weakening unforgeability.

**Progress / handover:**

- [ ] Completed:
- [ ] Next step:
- [ ] Blocked (needed from whom):
- On disk:

---

## Task 6: Add `createChangePlan()` and `executeChangePlan()` to client

**Traceability:** `REQ-TYPED-5` / `AC-5.1`, `AC-5.3`, `AC-5.4` → this task → `tests/client-change-plan.test.ts`
**Assigned to:** `joo-dev_6 · openai/gpt-5.5`
**Status:** backlog
**Review:**
**QA:** pending

**Description:** Add the public client ChangePlan flow for typed write/destructive operations, preserving deny-by-default behavior and verifier order.

**Scope:**

- Extend `src/client.ts` after Task 4.
- Use canonical operation authentication.
- Wire default verifier and default typed-write executor when using `fromTransport()`.

**Do NOT:**

- Do NOT execute write/destructive operations via `invoke()`.
- Do NOT bypass verifier.
- Do NOT make `denyAllVerifier` pass.
- Do NOT add real verifier implementation.
- Do NOT add SSH/MCP/live connection.
- Do NOT change domains semantics.
- Do NOT commit/push/`gh`.

**Implementation steps:**

1. Edit `src/client.ts` (after Task 4 is merged in the same file).
2. Import:
   ```ts
   import type { ChangePlan, TypedWriteExecutor } from "./internal/change-plan/change-plan.js";
   import { DefaultTypedWriteExecutor } from "./internal/change-plan/change-plan.js";
   import { denyAllVerifier, type ChangePlanVerifier } from "./internal/change-plan/verifier.js";
   ```
3. Add public meta type:
   ```ts
   export interface ChangePlanMeta {
     readonly intent: string;
     readonly rollbackNotes: string;
   }
   ```
4. Add client options:
   ```ts
   export interface Vigor3912SClientOptions {
     readonly changePlanVerifier?: ChangePlanVerifier;
     readonly typedWriteExecutor?: TypedWriteExecutor;
   }
   ```
5. Extend class fields (default verifier `denyAllVerifier`).
6. Keep existing constructor compatible:
   ```ts
   public constructor(runner?: CommandRunner, options: Vigor3912SClientOptions = {})
   ```
7. Update `fromTransport`:
   ```ts
   public static fromTransport(
     transport: Transport,
     options: Vigor3912SClientOptions = {},
   ): Vigor3912SClient {
     const runner = new DefaultCommandRunner(transport);
     return new Vigor3912SClient(runner, {
       ...options,
       typedWriteExecutor: options.typedWriteExecutor ?? new DefaultTypedWriteExecutor(runner),
     });
   }
   ```
8. Share the canonical-descriptor authentication helper with `invoke()` (from Task 4).
9. Add:
   ```ts
   public createChangePlan<TInput>(
     operation: TypedOperation<TInput, unknown>,
     input: TInput,
     meta: ChangePlanMeta,
   ): ChangePlan
   ```
   Behavior:
   - reject forged descriptors with `forged_operation_rejected`
   - reject `classification === "read"` with `typed_write_requires_change_plan` message saying read ops use `invoke()`
   - return `{ manifestId: operation.manifestId, intent: meta.intent, frames: operation.buildFrames(input), rollbackNotes: meta.rollbackNotes }`
10. Add:
    ```ts
    public async executeChangePlan(plan: ChangePlan): Promise<void>
    ```
    Behavior:
    - `await verifier.authorize(plan)`
    - `await verifier.backup(plan)`
    - `await verifier.verifyReplay(plan)`
    - `const verified = await verifier.verify(plan)`
    - if no executor, reject `OperationNotImplementedError`
    - `await typedWriteExecutor.execute(verified)`
11. Add `tests/client-change-plan.test.ts`:
    - write op builds expected `manifestId`, `intent`, `rollbackNotes`, frames
    - destructive op can create a plan but still must verify before dispatch
    - read op `createChangePlan` rejects with `typed_write_requires_change_plan`
    - forged write op rejects with `forged_operation_rejected`
    - default `denyAllVerifier` rejects on `authorize` and fake transport has zero calls
    - custom verifier records exact order `authorize`, `backup`, `verifyReplay`, `verify`
    - after custom verifier returns verified plan, `DefaultTypedWriteExecutor` dispatches frames
    - no executor rejects after verification with `OperationNotImplementedError`

**Acceptance criteria:**

- [ ] `createChangePlan()` builds frames through descriptor.
- [ ] `executeChangePlan()` verifier order is exact.
- [ ] Default client rejects before dispatch via `denyAllVerifier`.
- [ ] Verified plan dispatches only through `TypedWriteExecutor`.

**NFR:** Safety: deny-by-default remains actual boundary.

**Verification:**

```bash
cd projects/vigor3912s/sdk
npm run format:check && npm run lint && npm run typecheck && npm test
```

**Tests to write:**

- `tests/client-change-plan.test.ts`

**Dependencies:** Task 1, Task 4, Task 5

**Files likely touched:**

- `src/client.ts`
- `tests/client-change-plan.test.ts`

**Write scope (touches):**

- `src/client.ts`
- `tests/client-change-plan.test.ts`

**Provides / requires:**

- Provides `ChangePlanMeta`, `Vigor3912SClientOptions`, `createChangePlan()`, `executeChangePlan()`
- Requires `DefaultTypedWriteExecutor`

**Risks / rollback:** High safety risk if verifier order/bypass is wrong. Roll back all client ChangePlan additions if any write can dispatch with default verifier.

**DoD:** Default verifier blocks before transport calls. Custom verifier test proves order and dispatch. No `invoke()` write bypass.

**Ask for help when:**

- A test shows transport calls before `verify()`.
- Constructor compatibility breaks existing public tests.
- A real verifier seems required; it is out of scope.

**Progress / handover:**

- [ ] Completed:
- [ ] Next step:
- [ ] Blocked (needed from whom):
- On disk:

---

## Wave C checkpoint

```bash
cd projects/vigor3912s/sdk
npm run format:check && npm run lint && npm run typecheck && npm run build && npm test && npm run manifest:check
```

---

# Wave D — Docs, metadata, and final QA

## Task 7: Document public typed operations API and append Wave 6 status

**Traceability:** `REQ-TYPED-6` / `AC-6.1` → this task → docs diff + package/docs tests
**Assigned to:** `joo-dev_7 · openai/gpt-5.5`
**Status:** backlog
**Review:**
**QA:** pending

**Description:** Update repository documentation to describe the public typed operations subpath, read invocation, ChangePlan write path, and unchanged non-goals.

**Scope:**

- README / API docs / HANDOVER / BACKLOG only.
- Update metadata honestly if needed.

**Do NOT:**

- Do NOT invent unverified commands.
- Do NOT claim live/SSH support.
- Do NOT claim ChangePlan writes are enabled by default.
- Do NOT add MCP docs as SDK scope.
- Do NOT commit/push/`gh`.

**Implementation steps:**

1. Edit `README.md`: add a read example (`operations.wan.wanStatus` via `client.invoke`) and a write example showing `createChangePlan()` + default denial.
2. Add `docs/operations.md`: explain `./operations`, canonical descriptor requirement, `invoke()` read-only behavior, ChangePlan path, non-goals (no SSH, no MCP, no live E2E).
3. Update `HANDOVER.md` §6c from pending to completed with the real final verification numbers.
4. Append `BACKLOG.md` "Wave 6" summary following existing convention.
5. Update `src/index.ts` metadata only if current wording becomes misleading. Do not overstate runtime support.

**Acceptance criteria:**

- [ ] Docs show real import paths.
- [ ] Docs state write/destructive typed ops require ChangePlan and default verifier denies.
- [ ] Docs preserve no SSH/no MCP/no live boundary.

**NFR:** Runtime Truth: every documented command/import must be verified by tests or build.

**Verification:**

```bash
cd projects/vigor3912s/sdk
npm run format:check && npm run lint && npm run typecheck && npm run build && npm test && npm run manifest:check
```

**Tests to write/update:** Update package/docs-related tests only if they assert README/metadata strings. No new product behavior tests.

**Dependencies:** Task 3, Task 4, Task 6

**Files likely touched:**

- `README.md`
- `docs/operations.md`
- `HANDOVER.md`
- `BACKLOG.md`
- `src/index.ts` only if metadata needs honesty update

**Write scope (touches):**

- `README.md`
- `docs/operations.md`
- `HANDOVER.md`
- `BACKLOG.md`
- `src/index.ts`

**Provides / requires:**

- Provides public typed API docs
- Requires completed API behavior

**Risks / rollback:** Low. Revert docs if they overclaim.

**DoD:** Docs match implemented behavior. Verification green. No invented live/SSH/MCP claims.

**Ask for help when:**

- README examples need a real transport implementation.
- Metadata wording requires root/user approval.

**Progress / handover:**

- [ ] Completed:
- [ ] Next step:
- [ ] Blocked (needed from whom):
- On disk:

---

## Task 8: Final independent container QA

**Traceability:** `REQ-TYPED-6` / `AC-6.2` → this task → `qa.md` evidence
**Assigned to:** `joo-qa · openai/gpt-5.5`
**Status:** backlog
**Review:** n/a
**QA:** pending

**Description:** Independently verify the reviewed implementation in an isolated Node container, including package build, coverage, dry pack, and installed consumer smoke.

**Scope:** Verification only. No source writes.

**Do NOT:** Do NOT edit product files. Do NOT mount `.env`. Do NOT connect to router. Do NOT install host tools. Do NOT commit/push/`gh`.

**Implementation steps:**

1. Use `node:24.21.0-bookworm` container; mount workspace read-only; copy to container-local writable dir.
2. Install npm 12.0.2 inside container.
3. Run `npm ci`, `npm run verify`, `npm pack --dry-run`.
4. Consumer smoke in temp dir: `npm pack`, install produced `.tgz`, run ESM script importing root + `./operations` (+ `import type` from `./operations`), assert `operations.wan.wanStatus` exists, assert zero-arg client `invoke` rejects without runner, assert `createChangePlan` + default `executeChangePlan` rejects before transport.
5. Record environment, commands, exit status, timings for `qa.md`.

**Acceptance criteria:**

- [ ] `npm run verify` passes in container.
- [ ] `npm pack --dry-run` includes `dist/operations`.
- [ ] Installed consumer smoke imports root + `./operations`.
- [ ] No `.env`, live, SSH, or MCP path used.

**NFR:** Reproducibility: all commands recorded exactly.

**Dependencies:** Task 7 and review gate complete

**Write scope (touches):** None (evidence only; `qa.md` written later from root-approved QA output)

**Ask for help when:** Docker cannot mount workspace read-only; container cannot access package tarball; any command fails.

---

# Final gate

```bash
cd projects/vigor3912s/sdk
npm run verify
npm audit --audit-level=moderate
```

---

# Parallel-safety matrix

| Wave | Parallel tasks      | Shared files?                                                               | Safe? |
| ---- | ------------------- | --------------------------------------------------------------------------- | ----- |
| A    | Task 1 + Task 2     | None. Task 1: `src/errors.ts`; Task 2: registry type/live mechanical casts. | Yes   |
| A    | Task 3 after Task 2 | Waits for Task 2; owns generator/package/operations barrel.                 | Yes   |
| B/C  | Task 4 ∥ Task 5     | No overlap (`src/client.ts` vs `src/internal/change-plan/*`).               | Yes   |
| B/C  | Task 6 after 4 + 5  | `src/client.ts` sequential after Task 4.                                    | Yes   |
| D    | Task 7 → Task 8     | Docs then QA. QA writes no source files.                                    | Yes   |

No two parallel tasks write the same file.

---

# Coverage map

| AC            | Covered by task |
| ------------- | --------------- |
| `AC-1.1..1.3` | Task 3          |
| `AC-2.1`      | Task 3          |
| `AC-2.2`      | Task 2          |
| `AC-3.1..3.3` | Task 4          |
| `AC-4.1..4.2` | Task 1, Task 4  |
| `AC-5.1`      | Task 6          |
| `AC-5.2`      | Task 5          |
| `AC-5.3..5.4` | Task 6          |
| `AC-5.5`      | Task 5, Task 6  |
| `AC-6.1`      | Task 7          |
| `AC-6.2`      | Task 8          |

# Explicit deferrals / out of scope

- Real SSH / `ssh2` transport: deferred to separate package/scope.
- MCP adapters, registry parity, or MCP server work: out of SDK scope.
- Live router E2E: requires separate explicit authorization.
- Production `ChangePlanVerifier`: not included; default remains `denyAllVerifier`.
- WebUI typed operations: out of this scope.
- Semantic changes to existing 472 domain operations: out of scope.
- Git commit/push/PR/`gh`: not authorized.
