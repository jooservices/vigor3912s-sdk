// Deliberately does NOT import `defineConfig`/anything from `"vitest/config"`.
// That module's type declarations transitively pull in `vite`'s own type
// graph, and the exact-pinned latest `vite@8.3.0` + `vitest@5.0.0` combination
// has a genuine upstream type-declaration inconsistency there (verified: `vite`'s
// own `ResolvedConfig` fails to extend its own `UserConfig` under this
// project's `skipLibCheck: false`, and `vitest/browser` is missing a type
// export it references) -- unrelated to anything in this file. Every existing
// test file already imports only from `"vitest"` (runtime API), never
// `"vitest/config"`, and hits none of this. `defineConfig` is a pure identity
// helper at runtime (`(x) => x`) that exists only for editor autocomplete, so
// a plain object export is functionally identical to Vitest and keeps this
// file fully covered by the project's real (skipLibCheck: false) typecheck
// without depending on a third-party package's broken .d.ts graph.
export default {
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      // `all: true` reports coverage for every included file, not only files
      // reachable from a test's import graph — otherwise an un-imported file
      // would silently vanish from the report instead of showing as 0%.
      all: true,
      include: ["src/**/*.ts"],
      exclude: [
        "tests/**", // test files themselves, not implementation
        "dist/**", // build output, not source
        "**/*.generated.ts", // generated data, no hand-written branches to cover
        "src/manifest/types.ts", // type-only: schema types, no runtime logic
        "src/internal/execution/transport.ts", // type-only: `Transport` port interface, no runtime logic
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 90,
      },
    },
  },
};
