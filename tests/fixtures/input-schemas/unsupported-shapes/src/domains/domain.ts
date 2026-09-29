/**
 * Synthetic fixture: input shapes that must fail generation loudly —
 * a recursive type and an omittable input with required properties.
 */

interface TypedOperation<TInput, TOutput> {
  readonly manifestId: string;
  readonly classification: string;
  readonly buildFrames: (input: TInput) => unknown;
  readonly parse: (exchanges: readonly unknown[]) => TOutput;
}

interface TreeInput {
  readonly name: string;
  readonly child?: TreeInput;
}

const treeOp: TypedOperation<TreeInput, unknown> = {
  manifestId: "fixture.recursive",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

interface RequiredFieldInput {
  readonly index: number;
}

const omittableOp: TypedOperation<RequiredFieldInput | undefined, unknown> = {
  manifestId: "fixture.omittable-required",
  classification: "read",
  buildFrames: (input) => input,
  parse: () => undefined,
};

export const operations: readonly TypedOperation<never, unknown>[] = [treeOp, omittableOp];
