/**
 * Synthetic fixture domain module for
 * `tests/tools/generate-input-schemas.test.ts` — every operation below uses
 * a deliberately unsupported `TInput` construct, proving `buildInputSchemas`
 * fails loudly (never emits `{}`) and lists every offending `manifestId`.
 * A local `TypedOperation` shape is declared here rather than imported from
 * the real SDK (`resolveInputType` only checks the resolved type's symbol
 * name "TypedOperation", not its origin module), keeping this fixture fully
 * self-contained under its own `tsconfig.json`.
 */

interface TypedOperation<TInput, TOutput> {
  readonly manifestId: string;
  readonly classification: string;
  readonly buildFrames: (input: TInput) => unknown;
  readonly parse: (exchanges: readonly unknown[]) => TOutput;
}

// -- index signature -------------------------------------------------------

interface WithIndexSignature {
  readonly [key: string]: number;
}

const indexSignatureOp: TypedOperation<WithIndexSignature, unknown> = {
  manifestId: "fixture.index-signature",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

// -- unknown (covers the shared any/unknown "unresolved type" branch) ------

const unknownOp: TypedOperation<unknown, unknown> = {
  manifestId: "fixture.unknown",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

// -- heterogeneous tuple -----------------------------------------------------

type HeterogeneousTuple = readonly [string, number];

const heterogeneousTupleOp: TypedOperation<HeterogeneousTuple, unknown> = {
  manifestId: "fixture.heterogeneous-tuple",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

// -- non-object intersection -------------------------------------------------

interface ObjectPart {
  readonly a: number;
}

type NonObjectIntersection = ObjectPart & string;

const nonObjectIntersectionOp: TypedOperation<NonObjectIntersection, unknown> = {
  manifestId: "fixture.non-object-intersection",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  indexSignatureOp,
  unknownOp,
  heterogeneousTupleOp,
  nonObjectIntersectionOp,
];
