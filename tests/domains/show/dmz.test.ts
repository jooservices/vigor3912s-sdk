import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowDmz } from "../../../src/internal/parsers/show/dmz.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.dmz";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

// Synthetic sample, RFC 5737 placeholder addresses -- structure mirrors the
// repeated "WAN<n> DMZ mapping status:" sections documented at
// `cli-reference-raw.txt` line 6733.
const SAMPLE_TEXT = `%      WAN1 DMZ mapping status:
 Index  Status  WAN1 aux IP     Private IP
----------------------------------------------------
   1    Disable 0.0.0.0

%      WAN2 DMZ mapping status:
 Index  Status  WAN2 aux IP     Private IP
----------------------------------------------------
   1    Enable 198.51.100.5    192.0.2.20
`;

describe("cli.show.dmz operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show dmz");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into per-WAN DMZ entries", () => {
    const result = parseShowDmz(SAMPLE_TEXT);

    expect(result).toEqual({
      entries: [
        { wan: 1, index: 1, status: "Disable", auxIp: "0.0.0.0", privateIp: null },
        { wan: 2, index: 1, status: "Enable", auxIp: "198.51.100.5", privateIp: "192.0.2.20" },
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

    const malformedResult = await runOperationAgainstFakeTransport(operation, "%% garbage");
    expect(malformedResult).toEqual({ entries: [] });
  });
});
