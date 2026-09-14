import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowStatistic } from "../../../src/internal/parsers/show/statistic.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.statistic";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

// Synthetic sample -- structure mirrors the "WAN<n> total TX: .. ,RX: .."
// lines documented at `cli-reference-raw.txt` line 6947, values changed to
// obviously-placeholder numbers.
const SAMPLE_TEXT = ` WAN1 total TX: 0 Bytes ,RX: 0 Bytes
 WAN2 total TX: 1 MB ,RX: 4 MB
`;

describe("cli.show.statistic operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show statistic");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into per-WAN TX/RX totals", () => {
    const result = parseShowStatistic(SAMPLE_TEXT);

    expect(result).toEqual({
      entries: [
        { wan: 1, tx: "0 Bytes", rx: "0 Bytes" },
        { wan: 2, tx: "1 MB", rx: "4 MB" },
      ],
    });
  });

  it("(3) is linked to a manifest entry with classification read and status implemented", () => {
    const entry = byId(MANIFEST_ID);

    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("read");
    expect(entry?.status).toBe("implemented");
  });

  it("(4) parses malformed/empty output to a minimal-safe empty result, not a crash", async () => {
    const operation = findOperation();

    const emptyResult = await runOperationAgainstFakeTransport(operation, "");
    expect(emptyResult).toEqual({ entries: [] });

    const malformedResult = await runOperationAgainstFakeTransport(operation, "garbage");
    expect(malformedResult).toEqual({ entries: [] });
  });
});
