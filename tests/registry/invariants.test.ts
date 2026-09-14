import { describe, expect, it } from "vitest";

import {
  assembleOperationRegistry,
  findRegistryManifestInvariantViolations,
} from "../../src/internal/registry/registry.js";
import type { TypedOperation } from "../../src/internal/registry/operation.js";
import type { CapabilityEntry, CliCapabilityEntry } from "../../src/manifest/types.js";

/**
 * Hand-built manifest fixtures for this test file only. These are NOT the
 * real generated manifest (`src/manifest/capability-manifest.generated.ts`
 * does not exist yet — that is Wave 1 Lane A's A2-A4 scope). They exist
 * purely to exercise the registry/manifest cross-check logic in isolation,
 * per B1's adjusted scope.
 */
function fixtureCliEntry(overrides: Partial<CliCapabilityEntry>): CliCapabilityEntry {
  return {
    kind: "cli-command",
    id: "cli.sys.version",
    title: "sys version",
    citation: { corpus: "user-guide-part-viii", rawLine: 1, pdfPage: 1 },
    classification: "read",
    classificationBasis: "command-map-family",
    status: "documented",
    operationIds: [],
    command: "sys version",
    commandPath: ["sys", "version"],
    firmwareBasis: "user-guide-v4.3.5.1",
    verifiedOnFirmware: null,
    ...overrides,
  };
}

function fixtureOperation(manifestId: string): TypedOperation<never, unknown> {
  return {
    manifestId,
    classification: "read",
    buildFrames: () => [],
    parse: () => undefined,
  };
}

describe("assembleOperationRegistry", () => {
  it("assembles an empty registry from an empty operation list", () => {
    const registry = assembleOperationRegistry([]);

    expect(registry.size).toBe(0);
  });

  it("assembles a registry keyed by manifestId", () => {
    const operation = fixtureOperation("cli.sys.version");
    const registry = assembleOperationRegistry([operation]);

    expect(registry.get("cli.sys.version")).toBe(operation);
  });

  it("rejects duplicate manifestId registrations", () => {
    const operations = [fixtureOperation("cli.sys.version"), fixtureOperation("cli.sys.version")];

    expect(() => assembleOperationRegistry(operations)).toThrow(
      /Duplicate typed operation registered for manifest id "cli\.sys\.version"/,
    );
  });
});

describe("findRegistryManifestInvariantViolations", () => {
  it("is vacuously satisfied for an empty registry and empty manifest", () => {
    const registry = assembleOperationRegistry([]);

    expect(findRegistryManifestInvariantViolations(registry, [])).toEqual([]);
  });

  it("reports no violations when every registry key exists in the manifest", () => {
    const manifest: readonly CapabilityEntry[] = [
      fixtureCliEntry({ id: "cli.sys.version", status: "implemented" }),
    ];
    const registry = assembleOperationRegistry([fixtureOperation("cli.sys.version")]);

    expect(findRegistryManifestInvariantViolations(registry, manifest)).toEqual([]);
  });

  it("flags a registry key with no matching manifest entry", () => {
    const registry = assembleOperationRegistry([fixtureOperation("cli.unknown.command")]);

    expect(findRegistryManifestInvariantViolations(registry, [])).toEqual([
      { kind: "unknown-manifest-id", manifestId: "cli.unknown.command" },
    ]);
  });

  it("does not flag a registry key whose manifest entry is destructive (amended 2026-09-13: destructive is classification metadata, not an exclusion)", () => {
    const manifest: readonly CapabilityEntry[] = [
      fixtureCliEntry({
        id: "cli.sys.reboot",
        command: "sys reboot",
        commandPath: ["sys", "reboot"],
        classification: "destructive",
        classificationBasis: "operations-danger-list",
        status: "documented",
      }),
    ];
    const registry = assembleOperationRegistry([fixtureOperation("cli.sys.reboot")]);

    expect(findRegistryManifestInvariantViolations(registry, manifest)).toEqual([]);
  });

  it("flags an implemented manifest entry with no registry entry", () => {
    const manifest: readonly CapabilityEntry[] = [
      fixtureCliEntry({ id: "cli.sys.version", status: "implemented" }),
    ];
    const registry = assembleOperationRegistry([]);

    expect(findRegistryManifestInvariantViolations(registry, manifest)).toEqual([
      { kind: "missing-registry-entry", manifestId: "cli.sys.version" },
    ]);
  });

  it("reports both invariant kinds together when both are violated", () => {
    const manifest: readonly CapabilityEntry[] = [
      fixtureCliEntry({ id: "cli.sys.version", status: "implemented" }),
    ];
    const registry = assembleOperationRegistry([fixtureOperation("cli.unknown.command")]);

    expect(findRegistryManifestInvariantViolations(registry, manifest)).toEqual(
      expect.arrayContaining([
        { kind: "unknown-manifest-id", manifestId: "cli.unknown.command" },
        { kind: "missing-registry-entry", manifestId: "cli.sys.version" },
      ]),
    );
  });
});
