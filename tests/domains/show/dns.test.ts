import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowDns } from "../../../src/internal/parsers/show/dns.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.dns";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

// Synthetic sample -- structure mirrors the repeated "%  LAN<n>  Primary/
// Secondary DNS: <value>" lines documented at `cli-reference-raw.txt` line
// 6772; RFC 5737 placeholder addresses where a value is set.
const SAMPLE_TEXT = `%%      Domain name server settings:
%  LAN1  Primary DNS: [Not set]
%  LAN1  Secondary DNS: [Not set]
%  LAN2  Primary DNS: 198.51.100.1
%  LAN2  Secondary DNS: 198.51.100.2
`;

describe("cli.show.dns operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show dns");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into per-LAN DNS entries", () => {
    const result = parseShowDns(SAMPLE_TEXT);

    expect(result).toEqual({
      entries: [
        { lan: "LAN1", primaryDns: null, secondaryDns: null },
        { lan: "LAN2", primaryDns: "198.51.100.1", secondaryDns: "198.51.100.2" },
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

    const malformedResult = await runOperationAgainstFakeTransport(operation, "garbage line");
    expect(malformedResult).toEqual({ entries: [] });
  });
});
