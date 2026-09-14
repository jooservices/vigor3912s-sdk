/**
 * Synthetic fixture domain module for `tests/registry/self-assembly.test.ts`.
 * NOT a real domain — exercises the "manifestId absent from the manifest"
 * self-assembly failure (`ARCHITECTURE.md` Item 5's "fails at test time").
 */

import type { TypedOperation } from "../../../../src/internal/registry/operation.js";

export const operations: readonly TypedOperation<never, unknown>[] = [
  {
    manifestId: "cli.does.not.exist",
    classification: "read",
    buildFrames: () => [],
    parse: () => "unreachable",
  },
];
