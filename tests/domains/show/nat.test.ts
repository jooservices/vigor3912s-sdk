import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowNat } from "../../../src/internal/parsers/show/nat.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.nat";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

// Synthetic sample, RFC 5737 placeholder address -- structure mirrors the
// "Port Redirection Running Table" documented at `cli-reference-raw.txt`
// line 6796.
const SAMPLE_TEXT = ` Port Redirection Running Table:
Index  Protocol  Public Port   Private IP        Private Port
 1            6        20011   192.0.2.10                8080
 2            0            0   0.0.0.0                      0
`;

describe("cli.show.nat operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show nat");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into NAT port redirection entries", () => {
    const result = parseShowNat(SAMPLE_TEXT);

    expect(result).toEqual({
      entries: [
        { index: 1, protocol: 6, publicPort: 20011, privateIp: "192.0.2.10", privatePort: 8080 },
        { index: 2, protocol: 0, publicPort: 0, privateIp: "0.0.0.0", privatePort: 0 },
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

    const malformedResult = await runOperationAgainstFakeTransport(operation, "not a table");
    expect(malformedResult).toEqual({ entries: [] });
  });
});
