/**
 * Synthetic fixture domain module for
 * `tests/tools/generate-input-schemas.test.ts` — a small, valid domain
 * module exercising the identifier-referenced-const shape (the common real
 * shape across `src/domains/*.ts`) plus an input-less operation, proving the
 * success path end-to-end against a real `ts.Program`.
 */

interface TypedOperation<TInput, TOutput> {
  readonly manifestId: string;
  readonly classification: string;
  readonly buildFrames: (input: TInput) => unknown;
  readonly parse: (exchanges: readonly unknown[]) => TOutput;
}

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) throw new Error(name);
}

type NoInput = ReturnType<() => void>;

interface GreetInput {
  readonly name: string;
}

const greetOp: TypedOperation<GreetInput, unknown> = {
  manifestId: "fixture.greet",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

const versionOp: TypedOperation<NoInput, unknown> = {
  manifestId: "fixture.version",
  classification: "read",
  buildFrames: () => undefined,
  parse: () => undefined,
};

interface DetailedInput {
  /** Name shown in the generated form. */
  readonly label: string;
  readonly enabled?: boolean;
  readonly tags: readonly string[];
  readonly pair: readonly [number, number];
}

const detailedOp: TypedOperation<DetailedInput, unknown> = {
  manifestId: "fixture.detailed",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

interface OptionalInput {
  readonly note?: string;
}

const optionalOp: TypedOperation<OptionalInput | undefined, unknown> = {
  manifestId: "fixture.optional",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

interface LeftInput {
  readonly left: string;
}

interface RightInput {
  readonly right?: boolean;
}

const intersectionOp: TypedOperation<LeftInput & RightInput, unknown> = {
  manifestId: "fixture.intersection",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

interface OptionalLeftInput {
  readonly maybeLeft?: string;
}

interface OptionalRightInput {
  readonly maybeRight?: boolean;
}

const optionalIntersectionOp: TypedOperation<OptionalLeftInput & OptionalRightInput, unknown> = {
  manifestId: "fixture.optional-intersection",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

interface TopLevelConstraintInput {
  readonly value: number;
}

declare const topLevelConstraintInput: TopLevelConstraintInput;
assertInteger(topLevelConstraintInput.value, "top-level constraint");

const topLevelConstraintOp: TypedOperation<TopLevelConstraintInput, unknown> = {
  manifestId: "fixture.top-level-constraint",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

function operationFor<TInput>(manifestId: string): TypedOperation<TInput, unknown> {
  return {
    manifestId,
    classification: "read",
    buildFrames: (input) => input,
    parse: () => undefined,
  };
}

function operationWithObject<TInput>(options: {
  readonly manifestId: string;
}): TypedOperation<TInput, unknown> {
  return operationFor<TInput>(options.manifestId);
}

const objectArgumentOp = operationWithObject<NoInput>({ manifestId: "fixture.object-argument" });
const positionalOp = operationFor<NoInput>("fixture.positional");
const dynamicId = "fixture.unreadable-static-id";
const unreadableOp = operationFor<NoInput>(dynamicId);
declare const uninitializedOp: TypedOperation<NoInput, unknown>;

export const operations: readonly TypedOperation<never, unknown>[] = [
  greetOp,
  versionOp,
  detailedOp,
  optionalOp,
  intersectionOp,
  optionalIntersectionOp,
  topLevelConstraintOp,
  objectArgumentOp,
  positionalOp,
  unreadableOp,
  uninitializedOp,
];
