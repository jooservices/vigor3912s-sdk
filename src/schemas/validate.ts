/**
 * Runtime check of an operation input against its generated JSON Schema —
 * exactly the keyword subset `json-schema-types.ts` declares. Typed callers
 * cannot pass a wrong shape, but untyped input (JSON from an MCP tool) can,
 * and string-coercing validators would otherwise read `undefined` as the
 * text "undefined". Messages name the path and the rule, never the value.
 */

import type { JsonSchema } from "./json-schema-types.js";

function typeMismatch(value: unknown, type: JsonSchema["type"]): boolean {
  switch (type) {
    case undefined:
      return false;
    case "object":
      return typeof value !== "object" || value === null || Array.isArray(value);
    case "array":
      return !Array.isArray(value);
    case "integer":
      return !Number.isInteger(value);
    case "number":
      return typeof value !== "number" || !Number.isFinite(value);
    default:
      return typeof value !== type;
  }
}

function objectProblem(
  value: Readonly<Record<string, unknown>>,
  schema: JsonSchema,
  path: string,
): string | undefined {
  const properties = schema.properties ?? {};

  for (const key of schema.required ?? []) {
    if (value[key] === undefined) {
      return `${path}.${key} is required.`;
    }
  }

  for (const [key, entry] of Object.entries(value)) {
    const property = properties[key];

    if (property === undefined) {
      if (schema.additionalProperties === false) {
        return `${path}.${key} is not a documented field.`;
      }
      continue;
    }

    if (entry !== undefined) {
      const problem = schemaProblem(entry, property, `${path}.${key}`);

      if (problem !== undefined) {
        return problem;
      }
    }
  }

  return undefined;
}

function arrayProblem(
  values: readonly unknown[],
  schema: JsonSchema,
  path: string,
): string | undefined {
  if (schema.minItems !== undefined && values.length < schema.minItems) {
    return `${path} must have at least ${String(schema.minItems)} entries.`;
  }

  if (schema.maxItems !== undefined && values.length > schema.maxItems) {
    return `${path} must have at most ${String(schema.maxItems)} entries.`;
  }

  const items = schema.items;

  if (items === undefined) {
    return undefined;
  }

  for (const [index, entry] of values.entries()) {
    const problem = schemaProblem(entry, items, `${path}[${String(index)}]`);

    if (problem !== undefined) {
      return problem;
    }
  }

  return undefined;
}

/** The first way `value` breaks `schema`, or `undefined` when it conforms. */
export function schemaProblem(
  value: unknown,
  schema: JsonSchema,
  path = "input",
): string | undefined {
  if (schema.oneOf !== undefined) {
    // TypeScript unions: any documented form is acceptable.
    return schema.oneOf.some((branch) => schemaProblem(value, branch, path) === undefined)
      ? undefined
      : `${path} does not match any documented form.`;
  }

  if (schema.const !== undefined && value !== schema.const) {
    return `${path} must be ${JSON.stringify(schema.const)}.`;
  }

  if (schema.enum !== undefined && !(schema.enum as readonly unknown[]).includes(value)) {
    return `${path} must be one of ${schema.enum.map((entry) => JSON.stringify(entry)).join(", ")}.`;
  }

  if (typeMismatch(value, schema.type)) {
    return `${path} must be of type ${String(schema.type)}.`;
  }

  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      return `${path} must be at least ${String(schema.minimum)}.`;
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      return `${path} must be at most ${String(schema.maximum)}.`;
    }
  }

  if (Array.isArray(value)) {
    return arrayProblem(value, schema, path);
  }

  if (schema.type === "object") {
    return objectProblem(value as Readonly<Record<string, unknown>>, schema, path);
  }

  return undefined;
}
