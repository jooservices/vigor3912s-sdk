/**
 * Typed-operation descriptor.
 *
 * Mirrors `ARCHITECTURE.md`'s "Item 2 — runner, typed-operation registry"
 * section (`TypedOperation<TInput, TOutput>` + `OperationRegistry`).
 */

import type { CommandFrame } from "../execution/framing.js";
import type { ExecutionLimits } from "../execution/limits.js";
import type { CommandExchange } from "../execution/transport.js";

export type OperationClassification = "read" | "write" | "destructive";

export interface TypedOperation<TInput, TOutput> {
  readonly manifestId: string;
  readonly classification: OperationClassification;
  readonly buildFrames: (input: TInput) => readonly CommandFrame[];
  readonly parse: (exchanges: readonly CommandExchange[]) => TOutput;
  readonly executionOverride?: Partial<ExecutionLimits>;
}

/**
 * `TInput` is `never` here because the map holds operations of differing,
 * unrelated input types side by side; only the map key (`manifestId`) and
 * `TOutput`-independent metadata are consumed generically. Callers must
 * narrow via `registry.get(id)` and their own knowledge of that id's real
 * `TInput`/`TOutput` before invoking `buildFrames`/`parse`.
 */
export type OperationRegistry = ReadonlyMap<string, TypedOperation<never, unknown>>;
