import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  checkSyntaxForms,
  findUntestedOperations,
  formatReport,
  formatSyntaxReport,
  main,
  readUsageRecords,
} from "../../tools/check-operation-usage.ts";

describe("tools/check-operation-usage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports operations whose buildFrames or parse no test executed", () => {
    const untested = findUntestedOperations(
      ["cli.a", "cli.b", "cli.c"],
      [
        { buildFrames: ["cli.a", "cli.b"], parse: ["cli.a"] },
        { buildFrames: [], parse: ["cli.b"] },
      ],
    );

    expect(untested).toEqual([{ manifestId: "cli.c", missing: ["buildFrames", "parse"] }]);
    expect(findUntestedOperations(["cli.x"], [{ buildFrames: ["cli.x"], parse: [] }])).toEqual([
      { manifestId: "cli.x", missing: ["parse"] },
    ]);
  });

  it("formats success and failure reports", () => {
    expect(formatReport([], 3)).toMatch(/census OK — all 3 operations/);
    expect(formatReport([{ manifestId: "cli.c", missing: ["parse"] }], 3)).toBe(
      "operation census FAILED — 1 of 3 operation(s) lack test execution:\n  - cli.c: parse",
    );
  });

  it("reads JSON usage records and fails clearly when none exist", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "op-usage-"));
    writeFileSync(
      path.join(directory, "a.json"),
      JSON.stringify({ buildFrames: ["x"], parse: [] }),
    );
    writeFileSync(path.join(directory, "ignored.txt"), "not json");

    expect(readUsageRecords(directory)).toEqual([{ buildFrames: ["x"], parse: [] }]);
    expect(() => readUsageRecords(path.join(directory, "missing"))).toThrow(
      /run the full test suite first/,
    );
  });

  it("main returns false and logs an error when an operation is untested", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "op-usage-"));
    writeFileSync(
      path.join(directory, "a.json"),
      JSON.stringify({ buildFrames: ["x"], parse: ["x"] }),
    );
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      main(
        directory,
        () => [],
        () => Promise.resolve(["x"]),
      ),
    ).resolves.toBe(true);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/census OK/));
    await expect(
      main(
        directory,
        () => [],
        () => Promise.resolve(["x", "y"]),
      ),
    ).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/y: buildFrames, parse/));
  });
});

describe("syntax-form census", () => {
  const forms = [
    { heading: "ip arp", rawLine: 1, form: "ip arp add <IP> <MAC> <LAN or WAN>" },
    { heading: "ip arp", rawLine: 2, form: "ip arp flush" },
    { heading: "ip arp", rawLine: 3, form: "ip arp setCacheLife <time>" },
  ];
  const records = [
    { buildFrames: [], parse: [], commands: ["ip arp add 1.1.1.1 AA:BB:CC:DD:EE:FF LAN"] },
    { buildFrames: [], parse: [], commands: ["ip arp flush"] },
  ];

  it("reports uncovered forms that are not excluded", () => {
    const census = checkSyntaxForms(forms, records, {});

    expect(census.uncovered.map((form) => form.form)).toEqual(["ip arp setCacheLife <time>"]);
    expect(census.staleExclusions).toEqual([]);
    expect(formatSyntaxReport(census, 0)).toMatch(
      /1 uncovered form\(s\)[\s\S]*rawLine 3\): ip arp setCacheLife <time>/,
    );
  });

  it("accepts reasoned exclusions and flags exclusions that became covered", () => {
    const census = checkSyntaxForms(forms, records, {
      "ip arp setCacheLife <time>": "pending",
      "ip arp flush": "pending",
    });

    expect(census.uncovered).toEqual([]);
    expect(census.staleExclusions).toEqual(["ip arp flush"]);
    expect(formatSyntaxReport(census, 2)).toMatch(/now covered, remove exclusion: ip arp flush/);
    expect(
      formatSyntaxReport(
        checkSyntaxForms(forms, records, { "ip arp setCacheLife <time>": "pending" }),
        1,
      ),
    ).toBe(
      "syntax-form census OK — 2 of 3 documented forms covered by tests, 1 excluded with a reason.",
    );
  });

  it("main fails when a documented form is uncovered", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "op-usage-"));
    writeFileSync(
      path.join(directory, "a.json"),
      JSON.stringify({ buildFrames: ["x"], parse: ["x"], commands: [] }),
    );
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      main(
        directory,
        () => [{ heading: "zz", rawLine: 9, form: "zz never tested" }],
        () => Promise.resolve(["x"]),
      ),
    ).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/zz never tested/));
  });
});
