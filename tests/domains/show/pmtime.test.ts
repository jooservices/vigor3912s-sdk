import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowPmtime } from "../../../src/internal/parsers/show/pmtime.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.pmtime";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

// Synthetic sample -- structure mirrors the "Level<n> TCP=.. UDP=.. ICMP=.."
// lines documented at `cli-reference-raw.txt` line 6829, values changed to
// obviously-placeholder numbers.
const SAMPLE_TEXT = `  Level0 TCP=99999999 UDP=88888 ICMP=7777
  Level1 TCP=600000 UDP=90000 ICMP=7000
  Level2 TCP=60000 UDP=30000 ICMP=5000
`;

describe("cli.show.pmtime operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show pmtime");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into per-level TCP/UDP/ICMP reuse times", () => {
    const result = parseShowPmtime(SAMPLE_TEXT);

    expect(result).toEqual({
      level0: { tcp: 99999999, udp: 88888, icmp: 7777 },
      level1: { tcp: 600000, udp: 90000, icmp: 7000 },
      level2: { tcp: 60000, udp: 30000, icmp: 5000 },
    });
  });

  it("(3) is linked to a manifest entry with classification read and status implemented", () => {
    const entry = byId(MANIFEST_ID);

    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("read");
    expect(entry?.status).toBe("implemented");
  });

  it("(4) parses malformed/empty output to a minimal-safe null result, not a crash", async () => {
    const operation = findOperation();

    const emptyResult = await runOperationAgainstFakeTransport(operation, "");
    expect(emptyResult).toEqual({ level0: null, level1: null, level2: null });

    const malformedResult = await runOperationAgainstFakeTransport(operation, "garbage");
    expect(malformedResult).toEqual({ level0: null, level1: null, level2: null });
  });
});
