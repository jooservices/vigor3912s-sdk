/**
 * Synthetic fixture domain module for
 * `tests/tools/generate-input-schemas.test.ts`'s manifestId cross-check
 * case: the test drives `buildInputSchemas` with a
 * `domainOperationsInFileOrder` entry whose `manifestId` does not match
 * this file's own statically-readable `manifestId: "..."` literal at the
 * same array position, proving the per-element cross-check fails loudly and
 * names this file/position rather than silently trusting the runtime value.
 */

interface TypedOperation<TInput, TOutput> {
  readonly manifestId: string;
  readonly classification: string;
  readonly buildFrames: (input: TInput) => unknown;
  readonly parse: (exchanges: readonly unknown[]) => TOutput;
}

const namedOp: TypedOperation<void, unknown> = {
  manifestId: "fixture.manifest-id-mismatch.real",
  classification: "read",
  buildFrames: () => undefined,
  parse: () => undefined,
};

export const operations: readonly TypedOperation<never, unknown>[] = [namedOp];
