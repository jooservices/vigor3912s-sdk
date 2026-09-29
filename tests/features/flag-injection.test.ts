import { describe, expect, it } from "vitest";

import { operationRegistry } from "../../src/internal/registry/registry.generated.js";
import { inputSchemaFor, type JsonSchema } from "../../src/schemas/index.js";

/**
 * Flag-injection census: for every operation, every string field of an input
 * generated from its JSON Schema is replaced with flag-like values. No
 * built command may then carry an unquoted `-Z` token — a caller must never
 * be able to add options beyond what the operation validates.
 */

/** Opaque tails whose syntax is undocumented, so dash tokens pass through. */
const OPAQUE_FIELDS: ReadonlySet<string> = new Set(["cli.vrrp.set param"]);

const STRING = "\u0000string";
const BASES = [
  "abc",
  "192.168.1.1",
  "00:11:22:33:44:55",
  "00-11-22-33-44-55",
  "001122334455",
  "1",
  "wan1",
  "lan1",
  "on",
  "2001:db8::1",
  "255.255.255.0",
  "12:30",
  "/",
];
const EVIL = (base: string): readonly string[] => [`${base} -Z`, "-Z", `${base}" -Z "`];

type Json = string | number | boolean | null | undefined | Json[] | { [key: string]: Json };

function candidates(schema: JsonSchema | undefined): Json[] {
  if (schema === undefined) {
    return [undefined];
  }

  const node = schema as Record<string, unknown>;

  if (node.const !== undefined) {
    return [node.const as Json];
  }

  if (Array.isArray(node.enum)) {
    return [node.enum[0] as Json];
  }

  const union = (node.anyOf ?? node.oneOf) as JsonSchema[] | undefined;

  if (union !== undefined) {
    return union.flatMap((member) => candidates(member));
  }

  const type = Array.isArray(node.type) ? (node.type[0] as string) : (node.type as string);

  switch (type) {
    case "string":
      return [STRING];
    case "integer":
    case "number":
      return [(node.minimum as number | undefined) ?? 1];
    case "boolean":
      return [true];
    case "array": {
      const prefix = node.prefixItems as JsonSchema[] | undefined;

      if (prefix !== undefined) {
        return [prefix.map((item) => candidates(item)[0])];
      }

      const length = (node.minItems as number | undefined) ?? 1;
      return [Array.from({ length }, () => candidates(node.items as JsonSchema)[0])];
    }
    default: {
      const properties = (node.properties ?? {}) as Record<string, JsonSchema>;
      return [
        Object.fromEntries(
          Object.entries(properties).map(([key, value]) => [key, candidates(value)[0]]),
        ),
      ];
    }
  }
}

function stringPaths(value: Json, path: readonly string[] = []): (readonly string[])[] {
  if (value === STRING) {
    return [path];
  }

  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => stringPaths(child, [...path, key]));
  }

  return [];
}

function fill(value: Json, text: string, path: readonly string[] = [], at?: string): Json {
  if (value === STRING) {
    return at !== undefined && path.length === 0 ? at : text;
  }

  if (Array.isArray(value)) {
    return value.map((child, index) =>
      fill(child, text, path[0] === String(index) ? path.slice(1) : ["\u0000"], at),
    );
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        fill(child, text, path[0] === key ? path.slice(1) : ["\u0000"], at),
      ]),
    );
  }

  return value;
}

function build(id: string, input: Json): string | undefined {
  const operation = operationRegistry.get(id);

  try {
    return operation
      ?.buildFrames(input as never)
      .map((frame) => frame.command)
      .join(" | ");
  } catch {
    return undefined;
  }
}

function injectedFields(): readonly string[] {
  const found = new Set<string>();

  for (const id of operationRegistry.keys()) {
    const schema = inputSchemaFor(id);

    if (schema === null || schema === undefined) {
      continue;
    }

    for (const candidate of candidates(schema)) {
      for (const path of stringPaths(candidate)) {
        const base = BASES.find((text) => build(id, fill(candidate, text)) !== undefined);

        if (base === undefined) {
          continue;
        }

        for (const evil of EVIL(base)) {
          const command = build(id, fill(candidate, base, path, evil));

          if (command !== undefined && /(^|\s)-Z\b/.test(command.replace(/"[^"]*"/g, "Q"))) {
            found.add(`${id} ${path.join(".")}`);
          }
        }
      }
    }
  }

  return [...found].sort();
}

describe("flag-injection census", () => {
  it("lets no string field add an unquoted flag to a built command", () => {
    const leaks = injectedFields().filter((key) => !OPAQUE_FIELDS.has(key));

    expect(leaks).toEqual([]);
  });

  it("keeps the opaque-field list current", () => {
    const found = new Set(injectedFields());

    expect([...OPAQUE_FIELDS].filter((key) => !found.has(key))).toEqual([]);
  });
});
