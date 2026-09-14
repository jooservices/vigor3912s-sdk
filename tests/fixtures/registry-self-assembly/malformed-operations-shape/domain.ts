/**
 * Synthetic fixture domain module for `tests/registry/self-assembly.test.ts`.
 * NOT a real domain — exports `operations`, but its elements are not
 * `TypedOperation`-shaped (a plain string instead of an object with
 * `manifestId`/`classification`/`buildFrames`/`parse`). Exercises
 * `assertIsDomainModule`'s array-shape rejection and, transitively,
 * `isTypedOperationShaped`'s non-object guard.
 */

export const operations = ["not-a-typed-operation"];
