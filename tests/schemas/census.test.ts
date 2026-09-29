import { describe, expect, it } from "vitest";

import { operationRegistry } from "../../src/internal/registry/registry.generated.js";
import { inputSchemaFor, inputSchemas } from "../../src/schemas/index.js";
import type { JsonSchema } from "../../src/schemas/index.js";

const ALLOWED_SCHEMA_KEYS = new Set([
  "type",
  "properties",
  "required",
  "additionalProperties",
  "enum",
  "const",
  "oneOf",
  "items",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "description",
]);

/** Recursively walks a `JsonSchema`, asserting it only ever uses the documented keyword subset. */
function assertOnlyAllowedKeywords(schema: JsonSchema, path: string): void {
  for (const key of Object.keys(schema)) {
    expect(ALLOWED_SCHEMA_KEYS.has(key), `${path}: unexpected keyword "${key}"`).toBe(true);
  }

  if (schema.properties !== undefined) {
    for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
      assertOnlyAllowedKeywords(propertySchema, `${path}.properties.${propertyName}`);
    }
  }

  if (schema.items !== undefined) {
    assertOnlyAllowedKeywords(schema.items, `${path}.items`);
  }

  if (schema.oneOf !== undefined) {
    schema.oneOf.forEach((branch, index) => {
      assertOnlyAllowedKeywords(branch, `${path}.oneOf[${String(index)}]`);
    });
  }
}

describe("input schemas census", () => {
  it("has exactly one inputSchemas key per implemented operation manifestId, and vice versa", () => {
    const registryIds = new Set(operationRegistry.keys());
    const schemaIds = new Set(Object.keys(inputSchemas));

    expect(schemaIds).toEqual(registryIds);
  });

  it("has sorted keys", () => {
    const keys = Object.keys(inputSchemas);
    // Code-point order (locale-independent), as emitted by the generator.
    const sortedKeys = [...keys].sort();

    expect(keys).toEqual(sortedKeys);
  });

  it("has a non-null schema for every classified-input operation and null for void/never-input operations", () => {
    // Independent (non-generator) oracle for "does this operation declare an
    // input parameter at all": reads `buildFrames`'s own parameter list from
    // its compiled source text, rather than `Function#length` (which is 0
    // for a declared-but-defaulted parameter, e.g. `vpn.ts`'s
    // `buildL2lDropFrames(input: VpnL2lDropInput = {})` — a real, non-void
    // input type that still needs a non-null schema).
    function declaresInputParameter(buildFrames: (...args: readonly never[]) => unknown): boolean {
      const parameterList = /\(([^)]*)\)/.exec(buildFrames.toString())?.[1] ?? "";

      return parameterList.trim().length > 0;
    }

    for (const [manifestId, operation] of operationRegistry) {
      const schema = inputSchemaFor(manifestId);

      if (declaresInputParameter(operation.buildFrames)) {
        expect(schema, `${manifestId} should have a non-null schema`).not.toBeNull();
      } else {
        expect(schema, `${manifestId} should have a null (void/never input) schema`).toBeNull();
      }
    }
  });

  it("uses only the documented JsonSchema keyword subset, recursively, for every non-null schema", () => {
    for (const [manifestId, schema] of Object.entries(inputSchemas)) {
      if (schema !== null) {
        assertOnlyAllowedKeywords(schema, manifestId);
      }
    }
  });

  it("never sets additionalProperties to anything other than false", () => {
    function walk(schema: JsonSchema): void {
      if (schema.additionalProperties !== undefined) {
        expect(schema.additionalProperties).toBe(false);
      }

      for (const propertySchema of Object.values(schema.properties ?? {})) {
        walk(propertySchema);
      }

      if (schema.items !== undefined) {
        walk(schema.items);
      }

      for (const branch of schema.oneOf ?? []) {
        walk(branch);
      }
    }

    for (const schema of Object.values(inputSchemas)) {
      if (schema !== null) {
        walk(schema);
      }
    }
  });
});
