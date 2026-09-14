import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import {
  FixtureRedactionValidationError,
  redactFixture,
  validateRedactedFixture,
} from "../src/internal/fixture-redaction.js";
import { importRedactedFixture, parseFixtureImportArgs } from "../src/internal/fixture-importer.js";

const sensitiveFixture = [
  "router_ip=10.1.2.3",
  "backup_ip=10.1.2.3",
  "peer_ipv6=fd00:abcd:1234::1",
  "wan_mac=aa:bb:cc:dd:ee:ff",
  "hostname=edge-router.internal.test",
  "domain=office.example.test",
  "token=topsecret",
  "Authorization: Bearer syntheticcredential",
  "auth = Token spacedcredential",
  "password=hunter2",
  "cookie=sessionid",
].join("\n");

const sourceValues = [
  "10.1.2.3",
  "fd00:abcd:1234::1",
  "aa:bb:cc:dd:ee:ff",
  "edge-router.internal.test",
  "office.example.test",
  "topsecret",
  "syntheticcredential",
  "spacedcredential",
  "hunter2",
  "sessionid",
] as const;

describe("fixture redaction", () => {
  it("redacts sensitive network identifiers and labeled secret values", () => {
    const result = redactFixture(sensitiveFixture);

    expect(result.redactionCounts).toMatchObject({
      domain: 2,
      ipv4: 2,
      ipv6: 1,
      labeledValue: 5,
      mac: 1,
    });
    for (const sourceValue of sourceValues) {
      expect(result.content).not.toContain(sourceValue);
    }
    for (const secretSubstring of ["synthetic", "credential", "spaced"]) {
      expect(result.content).not.toContain(secretSubstring);
    }

    expect(result.content).toContain("198.51.100.");
    expect(result.content).toContain("2001:db8:");
    expect(result.content).toContain("02:00:00:00:00:");
    expect(result.content).toContain(".example.invalid");
  });

  it("keeps replacements deterministic for the same source value in one input", () => {
    const result = redactFixture(sensitiveFixture);
    const redactedAddresses = Array.from(result.content.matchAll(/198\.51\.100\.\d+/gu)).map(
      (match) => {
        return match[0];
      },
    );

    expect(redactedAddresses).toHaveLength(2);
    expect(new Set(redactedAddresses).size).toBe(1);
    expect(redactFixture(sensitiveFixture).content).toBe(result.content);
  });

  it("redacts authorization credentials after whitespace and auth schemes", () => {
    const result = redactFixture(
      "Authorization: Bearer syntheticcredential\nauth = Token spacedcredential",
    );

    for (const sourceValue of ["syntheticcredential", "spacedcredential", "credential"]) {
      expect(result.content).not.toContain(sourceValue);
    }
    expect(result.content).toContain("Authorization: Bearer redacted-");
    expect(result.content).toContain("auth = Token redacted-");
  });

  it("leaves already-redacted content unchanged on a second pass", () => {
    const once = redactFixture(sensitiveFixture);

    const twice = redactFixture(once.content);

    expect(twice.content).toBe(once.content);
    expect(twice.redactionCounts).toMatchObject({
      domain: 0,
      ipv4: 0,
      ipv6: 0,
      labeledValue: 0,
      mac: 0,
    });
  });

  it("redacts a bare domain that appears without a labeling keyword", () => {
    const result = redactFixture("connecting to portal.example.test for diagnostics");

    expect(result.redactionCounts.domain).toBe(1);
    expect(result.content).not.toContain("portal.example.test");
    expect(result.content).toContain(".example.invalid");
  });

  it("rejects unredacted sensitive forms without exposing match content", () => {
    expect(() => {
      validateRedactedFixture("Authorization: Bearer secretvalue");
    }).toThrow(FixtureRedactionValidationError);

    try {
      validateRedactedFixture("Authorization: Bearer secretvalue\nhostname=routername");
    } catch (error) {
      expect(error).toBeInstanceOf(FixtureRedactionValidationError);
      expect((error as Error).message).toContain("domain=1");
      expect((error as Error).message).toContain("labeledValue=1");
      for (const sourceValue of ["secretvalue", "routername"]) {
        expect((error as Error).message).not.toContain(sourceValue);
      }
    }
  });
});

describe("redacted fixture importer", () => {
  it("requires explicit input, output, and provenance flags", () => {
    expect(() => parseFixtureImportArgs(["--input", "tmp/source.txt"])).toThrow(/required/u);
  });

  it("rejects a dangling flag with no value", () => {
    expect(() => parseFixtureImportArgs(["--input", "tmp/source.txt", "--output"])).toThrow(
      /Usage:/u,
    );
  });

  it("parses fully specified CLI flags into fixture import options", () => {
    expect(
      parseFixtureImportArgs([
        "--input",
        "tmp/source.txt",
        "--output",
        "tests/fixtures/out.txt",
        "--provenance",
        "tests/fixtures/out.provenance.json",
      ]),
    ).toEqual({
      input: "tmp/source.txt",
      output: "tests/fixtures/out.txt",
      provenance: "tests/fixtures/out.provenance.json",
    });
  });

  it("wraps an unreadable input source in a redaction-safe error", async () => {
    const missingDirectory = await mkdtemp(join(tmpdir(), "vigor-fixture-missing-"));
    const missingSourcePath = join(missingDirectory, "does-not-exist.txt");

    await expect(
      importRedactedFixture({
        input: missingSourcePath,
        output: "tests/fixtures/generated/missing.fixture.txt",
        provenance: "tests/fixtures/generated/missing.fixture.provenance.json",
      }),
    ).rejects.toThrow("Unable to read external input source");
  });

  it("rejects output and provenance paths that resolve to the same file", async () => {
    await expect(
      importRedactedFixture({
        input: await createSyntheticSource(sensitiveFixture),
        output: "tests/fixtures/generated/same.txt",
        provenance: "tests/fixtures/generated/same.txt",
      }),
    ).rejects.toThrow("--output and --provenance must not overlap");
  });

  it("rejects overlapping output and provenance paths even when not identical", async () => {
    await expect(
      importRedactedFixture({
        input: await createSyntheticSource(sensitiveFixture),
        output: "tests/fixtures/generated/nested",
        provenance: "tests/fixtures/generated/nested/provenance.json",
      }),
    ).rejects.toThrow("--output and --provenance must not overlap");
  });

  it("writes only redacted output and safe provenance while preserving the source", async () => {
    const sourcePath = await createSyntheticSource(sensitiveFixture);
    const outputPath = "tests/fixtures/generated/synthetic.fixture.txt";
    const provenancePath = "tests/fixtures/generated/synthetic.fixture.provenance.json";

    try {
      const provenance = await importRedactedFixture({
        input: sourcePath,
        output: outputPath,
        provenance: provenancePath,
      });

      const output = await readFile(outputPath, "utf8");
      const provenanceContent = await readFile(provenancePath, "utf8");

      expect(await readFile(sourcePath, "utf8")).toBe(sensitiveFixture);
      for (const sourceValue of sourceValues) {
        expect(output).not.toContain(sourceValue);
        expect(provenanceContent).not.toContain(sourceValue);
      }

      expect(output).toContain("198.51.100.");
      expect(provenance.sourceKind).toBe("external-input");
      expect(provenance.sourceSha256).toMatch(/^[0-9a-f]{64}$/u);
      expect(provenance.redactionRuleVersion).toBe("fixture-redaction-v1");
      expect(provenanceContent).not.toContain(sourcePath);
      expect(provenanceContent).not.toContain("source.txt");
    } finally {
      await rm("tests/fixtures/generated", { force: true, recursive: true });
    }
  });

  it("rejects fixture sources and overlapping output paths", async () => {
    await expect(
      importRedactedFixture({
        input: "tests/fixtures/source.txt",
        output: "tests/fixtures/out.txt",
        provenance: "tests/fixtures/out.json",
      }),
    ).rejects.toThrow("--input must be outside tests/fixtures");

    await expect(
      importRedactedFixture({
        input: await createSyntheticSource(sensitiveFixture),
        output: "../outside.txt",
        provenance: "tests/fixtures/out.json",
      }),
    ).rejects.toThrow("--output must be under tests/fixtures");
  });
});

async function createSyntheticSource(content: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "vigor-fixture-redaction-"));
  const sourcePath = join(directory, "source.txt");

  await writeFile(sourcePath, content, "utf8");

  return sourcePath;
}
