/**
 * Synthetic fixture domain module for `tests/registry/self-assembly.test.ts`.
 * NOT a real domain — exercises `isTypedOperationShaped`'s classification
 * check against all three real classifications ("read" / "write" /
 * "destructive"), so the "write" and "destructive" arms of that check are
 * actually evaluated, not just the "read" arm the other fixtures use.
 */

import type { TypedOperation } from "../../../../src/internal/registry/operation.js";

export const operations: readonly TypedOperation<never, unknown>[] = [
  {
    manifestId: "cli.sys.version",
    classification: "read",
    buildFrames: () => [],
    parse: () => "synthetic-parsed-output",
  },
  {
    manifestId: "cli.sys.health",
    classification: "write",
    buildFrames: () => [],
    parse: () => "synthetic-parsed-output",
  },
  {
    manifestId: "cli.sys.reboot",
    classification: "destructive",
    buildFrames: () => [],
    parse: () => "synthetic-parsed-output",
  },
];
