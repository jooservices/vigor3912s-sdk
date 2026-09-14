import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowOpenport } from "../../../src/internal/parsers/show/openport.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.openport";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

// Synthetic sample, RFC 5737 placeholder address -- structure mirrors the
// Index/Status/Comment/Local IP Address table documented at
// `cli-reference-raw.txt` line 6787.
const SAMPLE_TEXT = `%%      Openport settings:
Index   Status  Comment         Local IP Address
********************************************************
  1.    Enable  EXAMPLE_1       192.0.2.9
Total 1 items listed.
`;

describe("cli.show.openport operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show openport");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into entries plus the total-items trailer", () => {
    const result = parseShowOpenport(SAMPLE_TEXT);

    expect(result).toEqual({
      entries: [{ index: 1, status: "Enable", comment: "EXAMPLE_1", localIp: "192.0.2.9" }],
      totalItems: 1,
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
    expect(emptyResult).toEqual({ entries: [], totalItems: null });

    const malformedResult = await runOperationAgainstFakeTransport(operation, "not a table");
    expect(malformedResult).toEqual({ entries: [], totalItems: null });
  });
});
