interface TypedOperation<TInput, TOutput> {
  readonly manifestId: string;
  readonly classification: string;
  readonly buildFrames: (input: TInput) => unknown;
  readonly parse: (exchanges: readonly unknown[]) => TOutput;
}

export const operations: readonly TypedOperation<void, unknown>[] = [
  {
    manifestId: "fixture.inline-object",
    classification: "read",
    buildFrames: () => undefined,
    parse: () => undefined,
  },
];
