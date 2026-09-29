/**
 * Synthetic fixture for numeric-constraint extraction, fixed-length tuples,
 * the recursion guard and the omittable-input rule in
 * `tests/tools/generate-input-schemas.test.ts`.
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

function assertIntegerInRange(value: number, min: number, max: number, name: string): void {
  assertInteger(value, name);
  if (value < min || value > max) throw new Error(name);
}

function assertPositiveInteger(value: number, name: string): void {
  assertIntegerInRange(value, 1, Number.MAX_SAFE_INTEGER, name);
}

const MAX_SLOT = 9;

interface RangedInput {
  readonly ranged: number;
  readonly positive: number;
  readonly integerOnly: number;
  readonly free: number;
  readonly pair: readonly [number, number];
}

const rangedOp: TypedOperation<RangedInput, unknown> = {
  manifestId: "fixture.ranged",
  classification: "write",
  buildFrames: (input) => {
    assertIntegerInRange(input.ranged, 1, MAX_SLOT, "ranged");
    assertPositiveInteger(input.positive, "positive");
    assertInteger(input.integerOnly, "integerOnly");
    return input;
  },
  parse: () => undefined,
};

interface SharedInput {
  readonly value: number;
}

const sharedLowOp: TypedOperation<SharedInput, unknown> = {
  manifestId: "fixture.shared-low",
  classification: "write",
  buildFrames: (input) => {
    assertIntegerInRange(input.value, 1, 10, "value");
    return input;
  },
  parse: () => undefined,
};

const sharedHighOp: TypedOperation<SharedInput, unknown> = {
  manifestId: "fixture.shared-high",
  classification: "write",
  buildFrames: (input) => {
    assertIntegerInRange(input.value, 2, 20, "value");
    return input;
  },
  parse: () => undefined,
};

interface SentinelInput {
  readonly timeout: number;
  readonly other: number;
}

const sentinelOp: TypedOperation<SentinelInput, unknown> = {
  manifestId: "fixture.sentinel",
  classification: "write",
  buildFrames: (input) => {
    if (input.timeout !== -1) {
      assertIntegerInRange(input.timeout, 1, 999, "timeout");
    }
    // A different property's comparison exempts nothing.
    if (input.timeout !== 0) {
      assertIntegerInRange(input.other, 1, 5, "other");
    }
    return input;
  },
  parse: () => undefined,
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  rangedOp,
  sentinelOp,
  sharedLowOp,
  sharedHighOp,
];
