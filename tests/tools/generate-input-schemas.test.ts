import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

import { describe, expect, it } from "vitest";

import {
  buildInputSchemas,
  compareCodePoints,
  collectNumericConstraints,
  createDomainsProgram,
  findOperationsArrayElements,
  InputSchemaGenerationError,
  unsupportedInputIssueFromError,
} from "../../tools/manifest/input-schemas.ts";
import type { TypedOperation } from "../../src/internal/registry/operation.js";

/**
 * Proves `buildInputSchemas` end-to-end against synthetic fixture domain
 * modules under `tests/fixtures/input-schemas/` (mirrors
 * `tests/registry/self-assembly.test.ts`'s fixture-directory pattern) —
 * never the real `src/domains/`, which is covered separately by
 * `tests/schemas/*.test.ts` against the real generated output.
 */

const fixturesRoot = path.join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "fixtures",
  "input-schemas",
);

function fakeOperation(manifestId: string): TypedOperation<never, unknown> {
  return {
    manifestId,
    classification: "read",
    buildFrames: () => [],
    parse: () => undefined,
  };
}

describe("buildInputSchemas — happy path", () => {
  it("resolves identifier inputs, optional properties, arrays, tuples, intersections and call forms", () => {
    const sdkRoot = path.join(fixturesRoot, "happy-path");
    const schemas = buildInputSchemas(
      sdkRoot,
      ["domain.ts"],
      [
        fakeOperation("fixture.greet"),
        fakeOperation("fixture.version"),
        fakeOperation("fixture.detailed"),
        fakeOperation("fixture.optional"),
        fakeOperation("fixture.intersection"),
        fakeOperation("fixture.optional-intersection"),
        fakeOperation("fixture.top-level-constraint"),
        fakeOperation("fixture.object-argument"),
        fakeOperation("fixture.positional"),
        fakeOperation("fixture.unreadable-static-id"),
        fakeOperation("fixture.uninitialized"),
      ],
    );

    expect(schemas).toEqual({
      "fixture.greet": {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
        additionalProperties: false,
      },
      "fixture.version": null,
      "fixture.detailed": {
        type: "object",
        properties: {
          label: { type: "string", description: "Name shown in the generated form." },
          enabled: { type: "boolean" },
          tags: { type: "array", items: { type: "string" } },
          pair: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
        },
        required: ["label", "tags", "pair"],
        additionalProperties: false,
      },
      "fixture.optional": {
        type: "object",
        properties: { note: { type: "string" } },
        additionalProperties: false,
      },
      "fixture.intersection": {
        type: "object",
        properties: { left: { type: "string" }, right: { type: "boolean" } },
        required: ["left"],
        additionalProperties: false,
      },
      "fixture.optional-intersection": {
        type: "object",
        properties: { maybeLeft: { type: "string" }, maybeRight: { type: "boolean" } },
        additionalProperties: false,
      },
      "fixture.top-level-constraint": {
        type: "object",
        properties: { value: { type: "integer" } },
        required: ["value"],
        additionalProperties: false,
      },
      "fixture.object-argument": null,
      "fixture.positional": null,
      "fixture.unreadable-static-id": null,
      "fixture.uninitialized": null,
    });
  });

  it("cross-checks an inline object's manifest id before rejecting its unresolved operation type", () => {
    expect(() =>
      buildInputSchemas(
        path.join(fixturesRoot, "inline-object"),
        ["domain.ts"],
        [fakeOperation("fixture.other-inline-id")],
      ),
    ).toThrow(/statically-read manifestId "fixture.inline-object".*"fixture.other-inline-id"/);
  });
});

describe("buildInputSchemas — unsupported TInput constructs (F-1)", () => {
  it("fails loudly with InputSchemaGenerationError listing every offending manifestId, never emitting {}", () => {
    const sdkRoot = path.join(fixturesRoot, "unsupported-constructs");
    const domainOperations = [
      fakeOperation("fixture.index-signature"),
      fakeOperation("fixture.unknown"),
      fakeOperation("fixture.heterogeneous-tuple"),
      fakeOperation("fixture.non-object-intersection"),
      fakeOperation("fixture.empty-tuple"),
      fakeOperation("fixture.function-input"),
      fakeOperation("fixture.non-operation"),
      fakeOperation("fixture.mapped"),
    ];

    let caught: unknown;

    try {
      buildInputSchemas(sdkRoot, ["domain.ts"], domainOperations);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(InputSchemaGenerationError);

    const error = caught as InputSchemaGenerationError;
    const issuesByManifestId = new Map(error.issues.map((issue) => [issue.manifestId, issue]));

    expect(issuesByManifestId.size).toBe(8);

    expect(issuesByManifestId.get("fixture.index-signature")?.reason).toMatch(
      /index signature.*WithIndexSignature/is,
    );
    expect(issuesByManifestId.get("fixture.unknown")?.reason).toMatch(/unresolved "unknown"/i);
    expect(issuesByManifestId.get("fixture.heterogeneous-tuple")?.reason).toMatch(
      /heterogeneous tuple.*HeterogeneousTuple/is,
    );
    expect(issuesByManifestId.get("fixture.non-object-intersection")?.reason).toMatch(
      /intersection.*NonObjectIntersection/is,
    );
    expect(issuesByManifestId.get("fixture.empty-tuple")?.reason).toMatch(/empty tuple/i);
    expect(issuesByManifestId.get("fixture.function-input")?.reason).toMatch(
      /unsupported type construct/i,
    );
    expect(issuesByManifestId.get("fixture.non-operation")?.reason).toMatch(
      /does not resolve to a TypedOperation/i,
    );
    expect(issuesByManifestId.get("fixture.mapped")?.reason).toMatch(
      /property .* has no declaration/i,
    );
  });
});

describe("buildInputSchemas — per-file element count mismatch (F-2)", () => {
  it("fails loudly and names the offending domain file when its runtime operation slice has the wrong length", () => {
    const sdkRoot = path.join(fixturesRoot, "count-mismatch");

    // This fixture's static "operations" array has 2 elements; supply only 1
    // runtime operation for it.
    expect(() =>
      buildInputSchemas(sdkRoot, ["domain.ts"], [fakeOperation("fixture.count-mismatch.one")]),
    ).toThrow(/domain\.ts.*static "operations" array has 2 element\(s\).*1 runtime operation/is);
  });
});

describe("buildInputSchemas — per-element manifestId cross-check (F-2)", () => {
  it("fails loudly and names the offending file/position when the static and runtime manifestId disagree", () => {
    const sdkRoot = path.join(fixturesRoot, "manifest-id-mismatch");

    expect(() =>
      buildInputSchemas(sdkRoot, ["domain.ts"], [fakeOperation("fixture.a-different-id")]),
    ).toThrow(
      /domain\.ts.*operations\[0\].*"fixture\.manifest-id-mismatch\.real".*"fixture\.a-different-id"/is,
    );
  });
});

describe("buildInputSchemas — constraints read from domain validators", () => {
  const schemas = buildInputSchemas(
    path.join(fixturesRoot, "constraints"),
    ["domain.ts"],
    [
      fakeOperation("fixture.ranged"),
      fakeOperation("fixture.sentinel"),
      fakeOperation("fixture.shared-low"),
      fakeOperation("fixture.shared-high"),
    ],
  );

  it("describes a range check skipped for a sentinel literal as that literal or the range", () => {
    expect(schemas["fixture.sentinel"]?.properties).toEqual({
      timeout: { oneOf: [{ const: -1 }, { type: "integer", minimum: 1, maximum: 999 }] },
      other: { type: "integer", minimum: 1, maximum: 5 },
      conflicting: { type: "integer", minimum: 1, maximum: 5 },
    });
  });

  it("emits integer + inclusive bounds (literal and const-resolved) and fixed tuple length", () => {
    expect(schemas["fixture.ranged"]?.properties).toEqual({
      ranged: { type: "integer", minimum: 1, maximum: 9 },
      positive: { type: "integer", minimum: 1 },
      integerOnly: { type: "integer" },
      free: { type: "number" },
      pair: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
    });
  });

  it("keeps only what every call site agrees on when one property is validated with different ranges", () => {
    expect(schemas["fixture.shared-low"]?.properties?.value).toEqual({ type: "integer" });
    expect(schemas["fixture.shared-high"]?.properties?.value).toEqual({ type: "integer" });
  });

  it("orders keys by code point, independent of the host locale", () => {
    expect(Object.keys(schemas)).toEqual([
      "fixture.ranged",
      "fixture.sentinel",
      "fixture.shared-high",
      "fixture.shared-low",
    ]);
  });

  it("keeps the minimum from the positive-integer helper", () => {
    expect(schemas["fixture.ranged"]?.properties?.positive).toEqual({
      type: "integer",
      minimum: 1,
    });
  });
});

describe("buildInputSchemas — shapes that cannot be described", () => {
  it("rejects recursive types and omittable inputs with required properties", () => {
    let caught: unknown;

    try {
      buildInputSchemas(
        path.join(fixturesRoot, "unsupported-shapes"),
        ["domain.ts"],
        [
          fakeOperation("fixture.recursive"),
          fakeOperation("fixture.omittable-required"),
          fakeOperation("fixture.omittable-optional-only"),
        ],
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(InputSchemaGenerationError);

    const reasons = new Map(
      (caught as InputSchemaGenerationError).issues.map((issue) => [
        issue.manifestId,
        issue.reason,
      ]),
    );

    expect(reasons.get("fixture.recursive")).toMatch(/recursive type "TreeInput"/);
    expect(reasons.get("fixture.omittable-required")).toMatch(
      /omitted argument cannot be described/,
    );
  });
});

describe("input schema tool guards and deterministic ordering", () => {
  it("ignores a validator property whose symbol has no declaration", () => {
    const sourceFile = ts.createSourceFile(
      "domain.ts",
      "assertInteger(input.value, 1, 10);",
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const checker = {
      getSymbolAtLocation: () => ({ declarations: undefined }),
    } as unknown as ts.TypeChecker;

    expect(collectNumericConstraints(checker, [sourceFile])).toEqual(new Map());
  });

  it("reports an unreadable project config", () => {
    expect(() => createDomainsProgram(path.join(fixturesRoot, "missing-project"), [])).toThrow(
      /Failed to read .*tsconfig\.json/,
    );
  });

  it("reports a domain file without an operations array", () => {
    const sourceFile = ts.createSourceFile(
      "domain.ts",
      "export const somethingElse = [];",
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );

    expect(() => findOperationsArrayElements(sourceFile, "domain.ts")).toThrow(
      /no top-level.*array literal/,
    );
  });

  it("reports a domain file that TypeScript could not load", () => {
    expect(() =>
      buildInputSchemas(path.join(fixturesRoot, "happy-path"), ["missing.ts"], []),
    ).toThrow(/Could not load program source file.*missing\.ts/);
  });

  it("reports extra runtime operations left after the last domain file", () => {
    expect(() =>
      buildInputSchemas(path.join(fixturesRoot, "happy-path"), [], [fakeOperation("extra")]),
    ).toThrow(/extra runtime operations left unconsumed/);
  });

  it("rethrows errors that do not represent an unsupported input type", () => {
    const error = new Error("unexpected tool failure");

    expect(() => unsupportedInputIssueFromError("fixture.greet", error)).toThrow(error);
  });

  it("compares equal code-point keys without locale-dependent ordering", () => {
    expect(compareCodePoints("same", "same")).toBe(0);
    expect(compareCodePoints("a", "b")).toBe(-1);
    expect(compareCodePoints("b", "a")).toBe(1);
  });
});
