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
    // Feature census: record which operations each test file executes
    // (see tests/support/operation-usage.ts, tools/check-operation-usage.ts).
    globalSetup: ["tests/support/operation-usage-global-setup.ts"],
    setupFiles: ["tests/support/operation-usage.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      // `all: true` reports coverage for every included file, not only files
      // reachable from a test's import graph — otherwise an un-imported file
      // would silently vanish from the report instead of showing as 0%.
      all: true,
      include: ["src/**/*.ts", "tools/**/*.ts"],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
        perFile: true,
      },
    },
  },
};
