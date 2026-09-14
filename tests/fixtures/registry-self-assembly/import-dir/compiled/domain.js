/**
 * Real, plain-JS sibling of `../source/domain.ts`, standing in for the
 * `tsconfig.generator.json`-compiled `dist/domains/*.js` output that
 * `discoverDomainOperations`'s `importDir` parameter actually `import()`s
 * (see that function's doc comment in `self-assembly.ts`). Deliberately
 * plain JavaScript — not transformed by Vitest — to prove the "actually
 * imports from `importDir`" code path with a genuine, separately-resolvable
 * module file, distinct from the `.ts` fixture used to list file names.
 */

export const operations = [
  {
    manifestId: "cli.sys.version",
    classification: "read",
    buildFrames: () => [],
    parse: () => "synthetic-parsed-output-from-compiled",
  },
];
