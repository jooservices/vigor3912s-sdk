/**
 * Hand-written JSON Schema subset used to describe every implemented
 * `TypedOperation`'s `TInput` type (`ARCHITECTURE.md` cross-cutting layout;
 * MCP-facing contract for `./schemas`).
 *
 * Deliberately narrow: only the keywords `tools/generate-input-schemas.ts`
 * ever emits. Not a general-purpose JSON Schema implementation (YAGNI) — no
 * `$ref`, `anyOf`, `allOf`, `patternProperties`, etc. Type
 * aliases/interfaces are always resolved and inlined by the generator, so
 * `$ref` is never needed.
 */

export type JsonSchemaPrimitiveType =
  "object" | "string" | "number" | "integer" | "boolean" | "array";

export interface JsonSchema {
  readonly type?: JsonSchemaPrimitiveType;
  /** Present only when `type` is `"object"`. */
  readonly properties?: Readonly<Record<string, JsonSchema>>;
  /** Present only when `type` is `"object"` and at least one property is required. */
  readonly required?: readonly string[];
  /** Present only when `type` is `"object"`; always `false` when present. */
  readonly additionalProperties?: false;
  /** Present only when `type` is `"string"` or `"number"` (literal-union fields). */
  readonly enum?: readonly (string | number)[];
  /** A single literal value (string, number, or boolean). */
  readonly const?: string | number | boolean;
  /** Inclusive bounds, read from the domain's own validator calls (`"number"`/`"integer"`). */
  readonly minimum?: number;
  readonly maximum?: number;
  /** Present only when `type` is `"array"`. */
  readonly items?: JsonSchema;
  /** Fixed-length (tuple) arrays only. */
  readonly minItems?: number;
  readonly maxItems?: number;
  /** A discriminated/object union: each branch is itself a `JsonSchema`. */
  readonly oneOf?: readonly JsonSchema[];
  /** Carried over from a source JSDoc comment on the corresponding property, when present. */
  readonly description?: string;
}
