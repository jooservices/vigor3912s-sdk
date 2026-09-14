/**
 * Synthetic fixture domain module for `tests/registry/self-assembly.test.ts`.
 * NOT a real domain — paired with `domain-b.ts` to exercise the
 * "duplicate manifest id across two domain files" self-assembly failure.
 */

import type { TypedOperation } from "../../../../src/internal/registry/operation.js";

export const operations: readonly TypedOperation<never, unknown>[] = [
  {
    manifestId: "cli.sys.version",
    classification: "read",
    buildFrames: () => [],
    parse: () => "from-domain-a",
  },
];
