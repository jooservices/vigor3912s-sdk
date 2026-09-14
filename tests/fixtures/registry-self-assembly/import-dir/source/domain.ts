/**
 * Synthetic fixture domain module for `tests/registry/self-assembly.test.ts`.
 * NOT a real domain — only its *file name* matters here:
 * `discoverDomainOperations`'s `importDir` parameter lists `.ts` file names
 * from this directory but actually `import()`s the sibling `.js` file with
 * the same base name from `../compiled/`, mirroring how
 * `tools/generate-capability-manifest.ts` imports `dist/domains/*.js` while
 * listing `src/domains/*.ts` (see `self-assembly.ts`'s `discoverDomainOperations`
 * doc comment). This file's own content is never imported by that test.
 */

import type { TypedOperation } from "../../../../../src/internal/registry/operation.js";

export const operations: readonly TypedOperation<never, unknown>[] = [
  {
    manifestId: "cli.sys.version",
    classification: "read",
    buildFrames: () => [],
    parse: () => "synthetic-parsed-output",
  },
];
