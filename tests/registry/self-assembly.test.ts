import { fileURLToPath } from "node:url";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildSelfAssembledRegistry,
  discoverDomainOperations,
  listDomainModuleFiles,
  overlayImplementedStatus,
  renderRegistryModule,
} from "../../src/internal/registry/self-assembly.js";
import type { CapabilityEntry, CliCapabilityEntry } from "../../src/manifest/types.js";

/**
 * Proves the B1 self-assembly mechanism end-to-end against synthetic fixture
 * domain modules under `tests/fixtures/registry-self-assembly/` (never the
 * real `src/domains/`, which does not exist yet — Wave 4 owns it). The
 * discovery/assembly functions under test are pure and take a directory path
 * parameter, so no test here writes to or reads from the real `src/domains/`.
 */

const fixturesRoot = path.join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "fixtures",
  "registry-self-assembly",
);

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

describe("listDomainModuleFiles / discoverDomainOperations — zero domains", () => {
  it("treats a missing domains directory as zero domains, not an error", async () => {
    const missingDir = path.join(fixturesRoot, "does-not-exist");

    await expect(listDomainModuleFiles(missingDir)).resolves.toEqual([]);
    await expect(discoverDomainOperations(missingDir)).resolves.toEqual([]);
  });

  it("leaves the manifest unchanged when the registry is empty", () => {
    const manifest: readonly CapabilityEntry[] = [
      fixtureCliEntry({ id: "cli.sys.version", status: "documented" }),
    ];
    const registry = buildSelfAssembledRegistry([], manifest);

    expect(registry.size).toBe(0);
    expect(overlayImplementedStatus(manifest, registry)).toEqual(manifest);
  });
});

describe("self-assembly — one domain, one read operation", () => {
  it("overlays status: implemented + operationIds onto the matching manifest entry", async () => {
    const domainsDir = path.join(fixturesRoot, "single-domain");
    const manifest: readonly CapabilityEntry[] = [
      fixtureCliEntry({ id: "cli.sys.version", status: "documented" }),
      fixtureCliEntry({
        id: "cli.sys.health",
        title: "sys health",
        command: "sys health",
        commandPath: ["sys", "health"],
        status: "documented",
      }),
    ];

    const operations = await discoverDomainOperations(domainsDir);
    expect(operations).toHaveLength(1);

    const registry = buildSelfAssembledRegistry(operations, manifest);
    expect(registry.get("cli.sys.version")?.manifestId).toBe("cli.sys.version");

    const overlaid = overlayImplementedStatus(manifest, registry);

    expect(overlaid).toEqual([
      fixtureCliEntry({
        id: "cli.sys.version",
        status: "implemented",
        operationIds: ["cli.sys.version"],
      }),
      // Unrelated entry keeps its prior status unchanged.
      fixtureCliEntry({
        id: "cli.sys.health",
        title: "sys health",
        command: "sys health",
        commandPath: ["sys", "health"],
        status: "documented",
      }),
    ]);
  });
});

describe("self-assembly — one domain, all three classifications", () => {
  it("shapes-validates read, write, and destructive operations alike", async () => {
    const domainsDir = path.join(fixturesRoot, "multi-classification");
    const manifest: readonly CapabilityEntry[] = [
      fixtureCliEntry({ id: "cli.sys.version", status: "documented" }),
      fixtureCliEntry({ id: "cli.sys.health", status: "documented" }),
      fixtureCliEntry({ id: "cli.sys.reboot", status: "documented" }),
    ];

    const operations = await discoverDomainOperations(domainsDir);
    expect(operations).toHaveLength(3);

    const registry = buildSelfAssembledRegistry(operations, manifest);

    expect(registry.get("cli.sys.version")?.classification).toBe("read");
    expect(registry.get("cli.sys.health")?.classification).toBe("write");
    expect(registry.get("cli.sys.reboot")?.classification).toBe("destructive");
  });
});

describe("self-assembly — domain module missing the required operations export", () => {
  it("fails at discovery time with a convention-violation message", async () => {
    const domainsDir = path.join(fixturesRoot, "missing-operations-export");

    await expect(discoverDomainOperations(domainsDir)).rejects.toThrow(
      /does not export "operations"/,
    );
  });
});

describe("self-assembly — domain module with a malformed operations shape", () => {
  it("fails at discovery time when an element is not TypedOperation-shaped", async () => {
    const domainsDir = path.join(fixturesRoot, "malformed-operations-shape");

    await expect(discoverDomainOperations(domainsDir)).rejects.toThrow(
      /"operations" export must be a readonly array of/,
    );
  });
});

describe("discoverDomainOperations — importDir", () => {
  it("lists file names from domainsDir but imports the sibling .js module from importDir", async () => {
    const domainsDir = path.join(fixturesRoot, "import-dir", "source");
    const importDir = path.join(fixturesRoot, "import-dir", "compiled");

    const operations = await discoverDomainOperations(domainsDir, importDir);

    expect(operations).toHaveLength(1);
    expect(operations[0]?.manifestId).toBe("cli.sys.version");
    expect(operations[0]?.parse([])).toBe("synthetic-parsed-output-from-compiled");
  });
});

describe("listDomainModuleFiles — non-ENOENT errors", () => {
  it("propagates a non-ENOENT readdir error instead of treating it as zero domains", async () => {
    // Passing a *file* path (not a directory) makes `readdir` reject with
    // ENOTDIR, a real, plausible caller mistake distinct from the
    // "directory does not exist yet" (ENOENT) case handled above.
    const notADirectory = path.join(fixturesRoot, "single-domain", "single.ts");

    await expect(listDomainModuleFiles(notADirectory)).rejects.toMatchObject({
      code: "ENOTDIR",
    });
  });
});

describe("self-assembly — duplicate manifest id across two domain files", () => {
  it("is a generation-time error", async () => {
    const domainsDir = path.join(fixturesRoot, "duplicate-ids");
    const manifest: readonly CapabilityEntry[] = [
      fixtureCliEntry({ id: "cli.sys.version", status: "documented" }),
    ];

    const operations = await discoverDomainOperations(domainsDir);

    expect(() => buildSelfAssembledRegistry(operations, manifest)).toThrow(
      /Duplicate typed operation registered for manifest id "cli\.sys\.version"/,
    );
  });
});

describe("self-assembly — manifestId absent from the manifest", () => {
  it("fails at generation time (ARCHITECTURE.md Item 5's defineOperation validation)", async () => {
    const domainsDir = path.join(fixturesRoot, "unknown-manifest-id");
    const manifest: readonly CapabilityEntry[] = [];

    const operations = await discoverDomainOperations(domainsDir);

    expect(() => buildSelfAssembledRegistry(operations, manifest)).toThrow(
      /manifestId does not exist in the capability manifest.*cli\.does\.not\.exist/,
    );
  });
});

describe("renderRegistryModule", () => {
  it("renders an empty aggregator when no domain files are discovered", () => {
    const rendered = renderRegistryModule([]);

    expect(rendered).toContain("GENERATED FILE");
    expect(rendered).toContain(
      "export const operationRegistry: OperationRegistry = assembleOperationRegistry([",
    );
    expect(rendered).not.toContain("../../domains/");
  });

  it("renders one import + spread per discovered domain file", () => {
    const rendered = renderRegistryModule(["sys.ts", "srv-nat.ts"]);

    expect(rendered).toContain(
      'import { operations as sysOperations } from "../../domains/sys.js";',
    );
    expect(rendered).toContain(
      'import { operations as srvNatOperations } from "../../domains/srv-nat.js";',
    );
    expect(rendered).toContain("...sysOperations,");
    expect(rendered).toContain("...srvNatOperations,");
  });

  it("falls back to a positional identifier when a file base name camelCases to an invalid identifier", () => {
    // "9wan.ts" camelCases to "9wan", which is not a valid identifier
    // (starts with a digit) -- exercises the `domain<index>Operations`
    // fallback instead of the derived name.
    const rendered = renderRegistryModule(["9wan.ts"]);

    expect(rendered).toContain(
      'import { operations as domain0Operations } from "../../domains/9wan.js";',
    );
    expect(rendered).toContain("...domain0Operations,");
  });
});
