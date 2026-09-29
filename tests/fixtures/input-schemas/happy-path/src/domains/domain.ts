/**
 * Synthetic fixture domain module for
 * `tests/tools/generate-input-schemas.test.ts` — a small, valid domain
 * module exercising the identifier-referenced-const shape (the common real
 * shape across `src/domains/*.ts`) plus a `void` operation, proving the
 * success path end-to-end against a real `ts.Program`.
 */

interface TypedOperation<TInput, TOutput> {
  readonly manifestId: string;
  readonly classification: string;
  readonly buildFrames: (input: TInput) => unknown;
  readonly parse: (exchanges: readonly unknown[]) => TOutput;
}

interface GreetInput {
  readonly name: string;
}

const greetOp: TypedOperation<GreetInput, unknown> = {
  manifestId: "fixture.greet",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

const versionOp: TypedOperation<void, unknown> = {
  manifestId: "fixture.version",
  classification: "read",
  buildFrames: () => undefined,
  parse: () => undefined,
};

export const operations: readonly TypedOperation<never, unknown>[] = [greetOp, versionOp];
