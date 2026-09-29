/**
 * Synthetic fixture domain module for
 * `tests/tools/generate-input-schemas.test.ts`'s per-file count-mismatch
 * case: the test drives `buildInputSchemas` with a `domainOperationsInFileOrder`
 * array whose length does not match this file's own static "operations"
 * array element count (2), proving the per-file guard fails loudly and
 * names this file rather than silently mis-slicing.
 */

interface TypedOperation<TInput, TOutput> {
  readonly manifestId: string;
  readonly classification: string;
  readonly buildFrames: (input: TInput) => unknown;
  readonly parse: (exchanges: readonly unknown[]) => TOutput;
}

const opOne: TypedOperation<void, unknown> = {
  manifestId: "fixture.count-mismatch.one",
  classification: "read",
  buildFrames: () => undefined,
  parse: () => undefined,
};

const opTwo: TypedOperation<void, unknown> = {
  manifestId: "fixture.count-mismatch.two",
  classification: "read",
  buildFrames: () => undefined,
  parse: () => undefined,
};

export const operations: readonly TypedOperation<never, unknown>[] = [opOne, opTwo];
