/**
 * Synthetic fixture domain module for `tests/registry/self-assembly.test.ts`.
 * NOT a real domain — deliberately violates the required export convention
 * (see `src/internal/registry/self-assembly.ts`) by omitting the
 * `operations` export entirely, exercising `assertIsDomainModule`'s
 * "does not export operations" rejection.
 */

export const notOperations = [];
