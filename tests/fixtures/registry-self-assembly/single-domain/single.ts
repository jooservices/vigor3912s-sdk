/**
 * Synthetic fixture domain module for `tests/registry/self-assembly.test.ts`.
 * NOT a real domain — exercises the "one domain with one read operation"
 * self-assembly scenario. Follows the required export convention documented
 * in `src/internal/registry/self-assembly.ts`.
 */

import type { TypedOperation } from "../../../../src/internal/registry/operation.js";

export const operations: readonly TypedOperation<never, unknown>[] = [
  {
    manifestId: "cli.sys.version",
    classification: "read",
    buildFrames: () => [],
    parse: () => "synthetic-parsed-output",
  },
];
