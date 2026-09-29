/**
 * Input JSON Schema generator (`ARCHITECTURE.md` cross-cutting layout;
 * `src/schemas/input-schemas.generated.ts`).
 *
 * Statically resolves every `src/domains/*.ts` module's `operations` array
 * element's `TInput` type via the TypeScript compiler API (full
 * type-checked program over the real project `tsconfig.json`, never the
 * erased runtime shape — `TInput` does not exist at runtime) and converts it
 * to the hand-written `JsonSchema` subset (`src/schemas/json-schema-types.ts`).
 * `void`/`never` input types become `null` (no-input operations; domain
 * modules use both — see the "positional correlation" note below).
 *
 * Domain modules build operations several different ways (a plain object
 * literal assigned to an `export const`, a private `const` only referenced
 * from the `operations` array, or a call to a small local per-domain
 * construction helper such as `log.ts`'s `defineReadOperation(...)` or
 * `show.ts`'s `defineOperation<TOutput>(...)`, sometimes with the
 * `manifestId` passed positionally). Rather than pattern-matching every such
 * shape to re-extract `manifestId` from syntax, this generator reads each
 * `operations` array's **elements in source order** and correlates them
 * *positionally* with the already-assembled, authoritative runtime
 * `TypedOperation[]` for that same domain file (`domainOperationsInFileOrder`,
 * sliced per file using each file's static element count) — `manifestId`
 * always comes from the real runtime value (already duplicate-checked by
 * `assembleOperationRegistry` upstream in `generate-capability-manifest.ts`'s
 * `main()`), while `TInput` always comes from
 * `checker.getTypeAtLocation(element)`'s resolved `TypedOperation<TInput,
 * TOutput>` type arguments — which works uniformly for every element shape
 * above, since the checker resolves a call expression's return type
 * (including generic instantiation) the same way it resolves an identifier's
 * declared/inferred type.
 *
 * Kept in its own module (not inlined into
 * `tools/generate-capability-manifest.ts`) per that file's existing SRP
 * note against entangling unrelated generator concerns — this module only
 * knows about "domain module TInput types -> JsonSchema", nothing about the
 * CLI/WebUI corpora or manifest classification.
 *
 * Called from `tools/generate-capability-manifest.ts`'s `main()` as a
 * sibling `.ts` import (not `.js` — this file is never compiled to `dist/`
 * by `tsconfig.generator.json`, whose `include` is `src/**\/*.ts` only;
 * `node --experimental-strip-types` resolves a literal `.ts` relative
 * specifier and strips its types transitively, unlike the `.js`-specifier
 * dist-import trick needed for `src/internal/registry/self-assembly.ts`,
 * see that file's import comment in `generate-capability-manifest.ts`).
 */

import path from "node:path";

import ts from "typescript";

import type { TypedOperation } from "../../src/internal/registry/operation.js";
import type { JsonSchema } from "../../src/schemas/json-schema-types.js";

/** Raised when a `TInput` type uses a construct outside the emitted `JsonSchema` subset. */
class UnsupportedInputTypeError extends Error {}

export interface UnsupportedInputTypeIssue {
  readonly manifestId: string;
  readonly reason: string;
}

/** Aggregates every unsupported-type issue found across all domain modules, per task contract ("report the list"). */
export class InputSchemaGenerationError extends Error {
  readonly issues: readonly UnsupportedInputTypeIssue[];

  constructor(issues: readonly UnsupportedInputTypeIssue[]) {
    super(
      `Cannot generate input schemas for ${String(issues.length)} operation(s):\n` +
        issues.map((issue) => `  - ${issue.manifestId}: ${issue.reason}`).join("\n"),
    );
    this.name = "InputSchemaGenerationError";
    this.issues = issues;
  }
}

/**
 * Builds a full type-checked `ts.Program` from the project's real
 * `tsconfig.json` (so module resolution, `strict`, and
 * `exactOptionalPropertyTypes` all match what `npm run typecheck` sees),
 * rooted at every discovered `src/domains/*.ts` file. The program resolves
 * every transitive dependency (parsers, execution types, ...) itself.
 */
export function createDomainsProgram(
  sdkRoot: string,
  domainFileNames: readonly string[],
): ts.Program {
  const configPath = path.join(sdkRoot, "tsconfig.json");
  const configFile = ts.readConfigFile(configPath, (fileToRead) => ts.sys.readFile(fileToRead));

  if (configFile.error !== undefined) {
    throw new Error(
      `Failed to read ${configPath}: ${ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n")}`,
    );
  }

  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, sdkRoot);
  const domainsDir = path.join(sdkRoot, "src", "domains");
  const rootNames = domainFileNames.map((fileName) => path.join(domainsDir, fileName));

  return ts.createProgram({ rootNames, options: { ...parsed.options, noEmit: true } });
}

/**
 * Finds one domain source file's `export const operations: readonly
 * TypedOperation<never, unknown>[] = [...]` array literal and returns its
 * elements in source order (matches
 * `internal/registry/self-assembly.ts`'s required domain export convention:
 * exactly this one export, this shape).
 */
export function findOperationsArrayElements(
  sourceFile: ts.SourceFile,
  fileName: string,
): readonly ts.Expression[] {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "operations" &&
        declaration.initializer !== undefined &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        return declaration.initializer.elements;
      }
    }
  }

  throw new Error(
    `Domain module "${fileName}" has no top-level "export const operations = [...]" array literal.`,
  );
}

/**
 * Reads a `manifestId: "..."` string-literal property off an object
 * literal, when present.
 */
function readManifestIdProperty(objectLiteral: ts.ObjectLiteralExpression): string | undefined {
  const manifestIdProperty = objectLiteral.properties.find(
    (property): property is ts.PropertyAssignment =>
      ts.isPropertyAssignment(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === "manifestId",
  );

  return manifestIdProperty !== undefined && ts.isStringLiteral(manifestIdProperty.initializer)
    ? manifestIdProperty.initializer.text
    : undefined;
}

/**
 * Best-effort static `manifestId` read for one `operations` array element,
 * for the F-2 per-element cross-check against the runtime value (never the
 * source of truth by itself — see `buildInputSchemas`). Handles every shape
 * seen across `src/domains/*.ts`: a bare object literal, an identifier
 * referencing a local `const` (resolved via `localConstInitializers`,
 * recursively — the common shape), a call to a local construction helper
 * with an object-literal argument (e.g. `log.ts`'s
 * `defineReadOperation({ manifestId: "...", ... })`), or a call with the id
 * passed positionally as its first string-literal argument (e.g. `mngt.ts`'s
 * `definePortOperation("cli.mngt.ftpport", ...)`). Returns `undefined`
 * (skip the check) when none of these shapes apply — not every construction
 * style is statically readable, and that is an accepted limitation, not an
 * error.
 */
function tryReadStaticManifestId(
  element: ts.Expression,
  localConstInitializers: ReadonlyMap<string, ts.Expression>,
): string | undefined {
  if (ts.isIdentifier(element)) {
    const initializer = localConstInitializers.get(element.text);

    return initializer === undefined
      ? undefined
      : tryReadStaticManifestId(initializer, localConstInitializers);
  }

  if (ts.isObjectLiteralExpression(element)) {
    return readManifestIdProperty(element);
  }

  if (ts.isCallExpression(element)) {
    const objectArgument = element.arguments.find(ts.isObjectLiteralExpression);
    const fromObjectArgument =
      objectArgument !== undefined ? readManifestIdProperty(objectArgument) : undefined;

    if (fromObjectArgument !== undefined) {
      return fromObjectArgument;
    }

    const [firstArgument] = element.arguments;

    return firstArgument !== undefined && ts.isStringLiteral(firstArgument)
      ? firstArgument.text
      : undefined;
  }

  return undefined;
}

/** Maps every top-level `const <name> = <initializer>` in `sourceFile` to its initializer expression. */
function localConstInitializers(sourceFile: ts.SourceFile): ReadonlyMap<string, ts.Expression> {
  const initializers = new Map<string, ts.Expression>();

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer !== undefined) {
        initializers.set(declaration.name.text, declaration.initializer);
      }
    }
  }

  return initializers;
}

/**
 * `ts.Type#symbol` is typed as always-present, but many real types (unions,
 * literals, primitives — anything not backed by a single named declaration)
 * genuinely have no symbol at runtime; narrowed through an inexact local
 * cast so the optional access is checked rather than assumed.
 */
function typeSymbolName(type: ts.Type): string | undefined {
  return (type as { readonly symbol?: ts.Symbol }).symbol?.name;
}

/** Numeric constraints proven by a domain validator call on one input property. */
interface NumericConstraint {
  readonly integer: boolean;
  readonly minimum?: number;
  readonly maximum?: number;
  /**
   * A literal the range check is skipped for (`if (input.x !== -1)
   * assertIntegerInRange(input.x, 1, 999, ...)`): the value is that literal
   * or within the range.
   */
  readonly sentinel?: number;
}

/**
 * Domain validator helpers whose semantics are identical in every domain
 * module (integer check + inclusive range). Constraints are read from their
 * call sites, so the schema never restates a range the code already owns.
 */
const CONSTRAINT_HELPERS: Readonly<
  Record<string, (args: readonly (number | undefined)[]) => NumericConstraint>
> = {
  assertInteger: () => ({ integer: true }),
  assertPositiveInteger: () => ({ integer: true, minimum: 1 }),
  assertNonNegativeInteger: () => ({ integer: true, minimum: 0 }),
  assertIntegerInRange: ([minimum, maximum]) => ({
    integer: true,
    ...(minimum !== undefined ? { minimum } : {}),
    ...(maximum !== undefined ? { maximum } : {}),
  }),
};

function numericLiteralValue(checker: ts.TypeChecker, node: ts.Expression): number | undefined {
  const type = checker.getTypeAtLocation(node);

  return type.isNumberLiteral() ? type.value : undefined;
}

function mergeConstraints(a: NumericConstraint, b: NumericConstraint): NumericConstraint {
  const sameRange = a.minimum === b.minimum && a.maximum === b.maximum;

  // A property validated with different ranges by different call sites has
  // no single range: keep only what every site agrees on.
  return {
    integer: a.integer && b.integer,
    ...(sameRange && a.minimum !== undefined ? { minimum: a.minimum } : {}),
    ...(sameRange && a.maximum !== undefined ? { maximum: a.maximum } : {}),
    ...(a.sentinel !== undefined && a.sentinel === b.sentinel ? { sentinel: a.sentinel } : {}),
  };
}

/**
 * The literal an enclosing `if (<target> !== <literal>)` exempts `call` from,
 * when the check sits in that `if`'s then-branch.
 */
function exemptedLiteral(
  checker: ts.TypeChecker,
  call: ts.CallExpression,
  target: ts.PropertyAccessExpression,
): number | undefined {
  for (
    let child: ts.Node = call, parent = call.parent;
    !ts.isSourceFile(parent);
    child = parent, parent = parent.parent
  ) {
    if (ts.isFunctionLike(parent)) {
      return undefined;
    }

    if (ts.isIfStatement(parent) && parent.thenStatement === child) {
      const condition = parent.expression;

      if (
        ts.isBinaryExpression(condition) &&
        condition.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken &&
        condition.left.getText() === target.getText()
      ) {
        return numericLiteralValue(checker, condition.right);
      }
    }
  }

  return undefined;
}

/**
 * Collects `assert*(input.<prop>, ...)` validator calls across the domain
 * sources, keyed by the validated property's declaration node.
 */
export function collectNumericConstraints(
  checker: ts.TypeChecker,
  sourceFiles: readonly ts.SourceFile[],
): ReadonlyMap<ts.Declaration, NumericConstraint> {
  const constraints = new Map<ts.Declaration, NumericConstraint>();

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const helper = CONSTRAINT_HELPERS[node.expression.text];
      const [target, ...rest] = node.arguments;

      if (helper !== undefined && target !== undefined && ts.isPropertyAccessExpression(target)) {
        const declaration = checker.getSymbolAtLocation(target.name)?.declarations?.[0];

        if (declaration !== undefined) {
          const range = helper(rest.map((argument) => numericLiteralValue(checker, argument)));
          const sentinel = exemptedLiteral(checker, node, target);
          const found = sentinel === undefined ? range : { ...range, sentinel };
          const existing = constraints.get(declaration);

          constraints.set(
            declaration,
            existing === undefined ? found : mergeConstraints(existing, found),
          );
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  for (const sourceFile of sourceFiles) {
    visit(sourceFile);
  }

  return constraints;
}

function applyNumericConstraint(
  schema: JsonSchema,
  constraint: NumericConstraint | undefined,
): JsonSchema {
  if (constraint === undefined || schema.type !== "number") {
    return schema;
  }

  const ranged: JsonSchema = {
    ...schema,
    ...(constraint.integer ? { type: "integer" as const } : {}),
    ...(constraint.minimum !== undefined ? { minimum: constraint.minimum } : {}),
    ...(constraint.maximum !== undefined ? { maximum: constraint.maximum } : {}),
  };

  return constraint.sentinel === undefined
    ? ranged
    : { oneOf: [{ const: constraint.sentinel }, ranged] };
}

/** Per-generation conversion state threaded through the recursive converters. */
interface ConversionContext {
  readonly checker: ts.TypeChecker;
  readonly manifestId: string;
  readonly constraints: ReadonlyMap<ts.Declaration, NumericConstraint>;
  /** Object types currently being converted (recursion guard). */
  readonly inProgress: Set<ts.Type>;
}

/** Resolves an `operations` array element's `TypedOperation<TInput, TOutput>` type argument (`TInput`). */
function resolveInputType(
  checker: ts.TypeChecker,
  element: ts.Expression,
  manifestId: string,
): ts.Type {
  const elementType = checker.getTypeAtLocation(element);

  if (typeSymbolName(elementType) !== "TypedOperation") {
    throw new UnsupportedInputTypeError(
      `manifestId "${manifestId}": operations array element does not resolve to a TypedOperation ` +
        `instantiation (got "${checker.typeToString(elementType)}").`,
    );
  }

  const [inputType] = checker.getTypeArguments(elementType as ts.TypeReference);

  if (inputType === undefined) {
    throw new UnsupportedInputTypeError(
      `manifestId "${manifestId}": could not resolve the TInput type argument of "${checker.typeToString(elementType)}".`,
    );
  }

  return inputType;
}

function isPlainObjectType(checker: ts.TypeChecker, type: ts.Type): boolean {
  return (
    (type.flags & ts.TypeFlags.Object) !== 0 &&
    !checker.isArrayType(type) &&
    !checker.isTupleType(type) &&
    checker.getSignaturesOfType(type, ts.SignatureKind.Call).length === 0 &&
    checker.getSignaturesOfType(type, ts.SignatureKind.Construct).length === 0
  );
}

function jsDocDescription(checker: ts.TypeChecker, symbol: ts.Symbol): string | undefined {
  const parts = symbol.getDocumentationComment(checker);
  const text = ts.displayPartsToString(parts).trim();

  return text.length > 0 ? text : undefined;
}

function schemasEqual(a: JsonSchema, b: JsonSchema): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Converts a fully-resolved object type (interface, type literal, or one union/intersection branch) to an object `JsonSchema`. */
function objectTypeToSchema(context: ConversionContext, type: ts.Type): JsonSchema {
  const { checker, manifestId } = context;

  if (context.inProgress.has(type)) {
    throw new UnsupportedInputTypeError(
      `manifestId "${manifestId}": recursive type "${checker.typeToString(type)}" is not supported.`,
    );
  }

  const indexInfos = checker.getIndexInfosOfType(type);

  if (indexInfos.length > 0) {
    throw new UnsupportedInputTypeError(
      `manifestId "${manifestId}": index signatures are not supported (type: ${checker.typeToString(type)}).`,
    );
  }

  context.inProgress.add(type);

  try {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const property of checker.getPropertiesOfType(type)) {
      const declaration = property.valueDeclaration ?? property.declarations?.[0];

      if (declaration === undefined) {
        throw new UnsupportedInputTypeError(
          `manifestId "${manifestId}": property "${property.name}" has no declaration to resolve its type from.`,
        );
      }

      const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
      let schema = applyNumericConstraint(
        typeToSchema(context, propertyType),
        context.constraints.get(declaration),
      );
      const description = jsDocDescription(checker, property);

      if (description !== undefined) {
        schema = { ...schema, description };
      }

      properties[property.name] = schema;

      if ((property.flags & ts.SymbolFlags.Optional) === 0) {
        required.push(property.name);
      }
    }

    return {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
      additionalProperties: false,
    };
  } finally {
    context.inProgress.delete(type);
  }
}

function unionToSchema(context: ConversionContext, type: ts.UnionType): JsonSchema {
  const constituents = type.types.filter(
    (constituent) => (constituent.flags & ts.TypeFlags.Undefined) === 0,
  );
  const [only] = constituents;

  if (constituents.length === 1 && only !== undefined) {
    return typeToSchema(context, only);
  }

  if (constituents.every((constituent) => constituent.isStringLiteral())) {
    return { type: "string", enum: constituents.map((constituent) => constituent.value) };
  }

  if (constituents.every((constituent) => constituent.isNumberLiteral())) {
    return { type: "number", enum: constituents.map((constituent) => constituent.value) };
  }

  // General fallback: one `oneOf` branch per constituent. Covers pure object
  // unions (discriminated or not) and mixed literal/object unions (e.g.
  // `cli.sys.autoreboot`'s `"on" | "off" | { hours }`).
  return { oneOf: constituents.map((constituent) => typeToSchema(context, constituent)) };
}

function intersectionToSchema(context: ConversionContext, type: ts.IntersectionType): JsonSchema {
  const { checker, manifestId } = context;

  if (!type.types.every((constituent) => isPlainObjectType(checker, constituent))) {
    throw new UnsupportedInputTypeError(
      `manifestId "${manifestId}": intersection "${checker.typeToString(type)}" has a non-object-type constituent and cannot be flattened.`,
    );
  }

  const properties: Record<string, JsonSchema> = {};
  const requiredSet = new Set<string>();

  for (const constituent of type.types) {
    const branch = objectTypeToSchema(context, constituent);

    Object.assign(properties, branch.properties);

    for (const key of branch.required ?? []) {
      requiredSet.add(key);
    }
  }

  const required = [...requiredSet];

  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  };
}

function tupleToSchema(context: ConversionContext, type: ts.TypeReference): JsonSchema {
  const { checker, manifestId } = context;
  const elementSchemas = checker
    .getTypeArguments(type)
    .map((elementType) => typeToSchema(context, elementType));
  const [firstSchema] = elementSchemas;

  if (firstSchema === undefined) {
    throw new UnsupportedInputTypeError(
      `manifestId "${manifestId}": empty tuple type "${checker.typeToString(type)}" is not supported.`,
    );
  }

  if (!elementSchemas.every((schema) => schemasEqual(schema, firstSchema))) {
    throw new UnsupportedInputTypeError(
      `manifestId "${manifestId}": heterogeneous tuple type "${checker.typeToString(type)}" cannot be flattened to a single "items" schema.`,
    );
  }

  // Fixed length is part of the contract: a shorter/longer array would build
  // a malformed command.
  return {
    type: "array",
    items: firstSchema,
    minItems: elementSchemas.length,
    maxItems: elementSchemas.length,
  };
}

/** Converts a resolved `ts.Type` (never a bare `void`/`undefined` top-level input — callers special-case that) to a `JsonSchema`. */
function typeToSchema(context: ConversionContext, type: ts.Type): JsonSchema {
  const { checker, manifestId } = context;

  if ((type.flags & ts.TypeFlags.Any) !== 0 || (type.flags & ts.TypeFlags.Unknown) !== 0) {
    throw new UnsupportedInputTypeError(
      `manifestId "${manifestId}": unresolved "${checker.typeToString(type)}" type (unresolved generic or missing annotation).`,
    );
  }

  if ((type.flags & ts.TypeFlags.Boolean) !== 0) {
    return { type: "boolean" };
  }

  if ((type.flags & ts.TypeFlags.BooleanLiteral) !== 0) {
    return { const: checker.typeToString(type) === "true" };
  }

  if (type.isStringLiteral() || type.isNumberLiteral()) {
    return { const: type.value };
  }

  if ((type.flags & ts.TypeFlags.String) !== 0) {
    return { type: "string" };
  }

  if ((type.flags & ts.TypeFlags.Number) !== 0) {
    return { type: "number" };
  }

  if (checker.isArrayType(type)) {
    const [elementType] = checker.getTypeArguments(type as ts.TypeReference);

    if (elementType === undefined) {
      throw new UnsupportedInputTypeError(
        `manifestId "${manifestId}": could not resolve array element type for "${checker.typeToString(type)}".`,
      );
    }

    return { type: "array", items: typeToSchema(context, elementType) };
  }

  if (checker.isTupleType(type)) {
    return tupleToSchema(context, type as ts.TypeReference);
  }

  if (type.isUnion()) {
    return unionToSchema(context, type);
  }

  if (type.isIntersection()) {
    return intersectionToSchema(context, type);
  }

  if (isPlainObjectType(checker, type)) {
    return objectTypeToSchema(context, type);
  }

  throw new UnsupportedInputTypeError(
    `manifestId "${manifestId}": unsupported type construct "${checker.typeToString(type)}".`,
  );
}

/**
 * Top-level `TInput`. `Foo | undefined` means "the whole argument may be
 * omitted"; JSON Schema cannot express an absent argument, so it is only
 * representable when `Foo` itself accepts `{}` (no required properties).
 */
function inputTypeToSchema(context: ConversionContext, inputType: ts.Type): JsonSchema | null {
  if ((inputType.flags & (ts.TypeFlags.Void | ts.TypeFlags.Never)) !== 0) {
    return null;
  }

  const schema = typeToSchema(context, inputType);
  const omittable =
    inputType.isUnion() &&
    inputType.types.some((constituent) => (constituent.flags & ts.TypeFlags.Undefined) !== 0);

  if (omittable && (schema.required?.length ?? 0) > 0) {
    throw new UnsupportedInputTypeError(
      `manifestId "${context.manifestId}": optional input "${context.checker.typeToString(inputType)}" has required properties; an omitted argument cannot be described.`,
    );
  }

  return schema;
}

/**
 * Builds the `{ manifestId -> JsonSchema | null }` map for every
 * operation in `domainOperationsInFileOrder` — the same flat, ordered array
 * `generate-capability-manifest.ts`'s `main()` already built via
 * `discoverDomainOperations(DOMAINS_DIR, DIST_DOMAINS_DIR)` (concatenating
 * each `domainFileNames[i]`'s `operations` export, in that file order).
 *
 * Correlates statically-parsed elements to runtime operations **per domain
 * file**, not with one global cursor: each file's own static "operations"
 * array element count must equal the number of runtime operations sliced
 * off for that file (a global-only count check could let one file's
 * over-count silently cancel out against another file's under-count and
 * still pass), and every element whose `manifestId` is statically readable
 * (`tryReadStaticManifestId`) is cross-checked against the runtime value at
 * that same position. Both checks fail loudly, naming the offending file.
 *
 * Throws `InputSchemaGenerationError` listing every unsupported `TInput`
 * construct found (never emits a partial/lossy schema).
 */
export function buildInputSchemas(
  sdkRoot: string,
  domainFileNames: readonly string[],
  domainOperationsInFileOrder: readonly TypedOperation<never, unknown>[],
): Readonly<Record<string, JsonSchema | null>> {
  const program = createDomainsProgram(sdkRoot, domainFileNames);
  const checker = program.getTypeChecker();
  const domainsDir = path.join(sdkRoot, "src", "domains");
  const domainSourceFiles = domainFileNames.flatMap((fileName) => {
    const sourceFile = program.getSourceFile(path.join(domainsDir, fileName));

    return sourceFile === undefined ? [] : [sourceFile];
  });
  const constraints = collectNumericConstraints(checker, domainSourceFiles);

  const schemas: Record<string, JsonSchema | null> = {};
  const issues: UnsupportedInputTypeIssue[] = [];
  let cursor = 0;

  for (const fileName of domainFileNames) {
    const filePath = path.join(domainsDir, fileName);
    const sourceFile = program.getSourceFile(filePath);

    if (sourceFile === undefined) {
      throw new Error(`Could not load program source file for domain module "${fileName}".`);
    }

    const elements = findOperationsArrayElements(sourceFile, fileName);
    const fileOperations = domainOperationsInFileOrder.slice(cursor, cursor + elements.length);

    if (fileOperations.length !== elements.length) {
      throw new Error(
        `Domain module "${fileName}": static "operations" array has ${String(elements.length)} ` +
          `element(s), but only ${String(fileOperations.length)} runtime operation(s) remain to ` +
          "consume at this position — static/runtime element count mismatch for this file.",
      );
    }

    cursor += elements.length;

    const localConsts = localConstInitializers(sourceFile);

    elements.forEach((element, indexInFile) => {
      const runtimeOperation = fileOperations[indexInFile];

      if (runtimeOperation === undefined) {
        // Unreachable given the length check above; guards `noUncheckedIndexedAccess`.
        throw new Error(
          `Domain module "${fileName}": internal error resolving operations[${String(indexInFile)}].`,
        );
      }

      const manifestId = runtimeOperation.manifestId;
      const staticManifestId = tryReadStaticManifestId(element, localConsts);

      if (staticManifestId !== undefined && staticManifestId !== manifestId) {
        throw new Error(
          `Domain module "${fileName}": operations[${String(indexInFile)}]'s statically-read ` +
            `manifestId "${staticManifestId}" does not match the runtime operation's manifestId ` +
            `"${manifestId}" at the same array position.`,
        );
      }

      try {
        const inputType = resolveInputType(checker, element, manifestId);

        schemas[manifestId] = inputTypeToSchema(
          { checker, manifestId, constraints, inProgress: new Set() },
          inputType,
        );
      } catch (error) {
        if (error instanceof UnsupportedInputTypeError) {
          issues.push({ manifestId, reason: error.message });
        } else {
          throw error;
        }
      }
    });
  }

  if (cursor !== domainOperationsInFileOrder.length) {
    throw new Error(
      `Total static "operations" array elements across every domain file (${String(cursor)}) and ` +
        `total runtime discovered operations (${String(domainOperationsInFileOrder.length)}) ` +
        "counts do not match (extra runtime operations left unconsumed after the last domain file).",
    );
  }

  if (issues.length > 0) {
    throw new InputSchemaGenerationError(issues);
  }

  return Object.fromEntries(
    Object.entries(schemas).sort(([left], [right]) => compareCodePoints(left, right)),
  );
}

/** Locale-independent ordering: generated output must not depend on the host's ICU locale. */
function compareCodePoints(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  return left > right ? 1 : 0;
}

/** Renders the generated `src/schemas/input-schemas.generated.ts` module source. */
export function renderInputSchemasModule(
  schemas: Readonly<Record<string, JsonSchema | null>>,
): string {
  const body = JSON.stringify(schemas, null, 2);

  return `/**
 * GENERATED FILE — do not hand-edit.
 *
 * Produced by \`tools/generate-capability-manifest.ts\` (via
 * \`tools/generate-input-schemas.ts\`) from every \`src/domains/*.ts\`
 * \`TypedOperation<TInput, TOutput>\` export's \`TInput\` type, resolved through
 * the TypeScript compiler API. Keyed by \`manifestId\`; \`null\` means the
 * operation takes no input (\`TInput\` is \`void\`).
 *
 * Regenerate with \`npm run manifest:generate\`; drift is caught by
 * \`npm run manifest:check\` (folded into \`npm run verify\`).
 */

import type { JsonSchema } from "./json-schema-types.js";

export const inputSchemas: Readonly<Record<string, JsonSchema | null>> = ${body};
`;
}
