/**
 * Public `./schemas` subpath: machine-readable JSON Schema for every
 * implemented `TypedOperation`'s input, keyed by `manifestId`. Lets a
 * downstream consumer (e.g. an MCP server) build tool argument schemas
 * without duplicating DrayOS command knowledge or depending on the SDK's
 * internal `TInput` TypeScript types at runtime.
 *
 * No manifest data or generation logic lives here — see
 * `input-schemas.generated.ts` (produced by
 * `tools/generate-input-schemas.ts`, invoked from
 * `tools/generate-capability-manifest.ts`).
 */

import { inputSchemas } from "./input-schemas.generated.js";
import type { JsonSchema } from "./json-schema-types.js";

export { inputSchemas };
export type { JsonSchema } from "./json-schema-types.js";
export { schemaProblem } from "./validate.js";

/** Looks up a single operation's input schema by its stable `manifestId`; `null` means no input, `undefined` means unknown id. */
export function inputSchemaFor(manifestId: string): JsonSchema | null | undefined {
  return Object.hasOwn(inputSchemas, manifestId) ? inputSchemas[manifestId] : undefined;
}
