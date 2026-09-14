import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowPortmap } from "../../../src/internal/parsers/show/portmap.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.portmap";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

// Synthetic sample, RFC 5737 placeholder addresses -- structure mirrors the
// NAT Active Sessions table documented at `cli-reference-raw.txt` line 6813.
const SAMPLE_TEXT = `-------------------------------------------------------------------------------
  P      Private_IP: Port       Pseudo_IP: Port          Peer_IP:Port ST LastTime DPDK
-------------------------------------------------------------------------------
  6  192.0.2.10:57410 198.51.100.5:57730   203.0.113.1:  443  6     1165    1
 17  192.0.2.10:55373 198.51.100.5:55693   203.0.113.2: 5355  0      293    0
`;

describe("cli.show.portmap operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show portmap");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into NAT active-session entries", () => {
    const result = parseShowPortmap(SAMPLE_TEXT);

    expect(result).toEqual({
      entries: [
        {
          protocol: 6,
          privateIp: "192.0.2.10",
          privatePort: 57410,
          pseudoIp: "198.51.100.5",
          pseudoPort: 57730,
          peerIp: "203.0.113.1",
          peerPort: 443,
          state: 6,
          lastTime: 1165,
          dpdk: 1,
        },
        {
          protocol: 17,
          privateIp: "192.0.2.10",
          privatePort: 55373,
          pseudoIp: "198.51.100.5",
          pseudoPort: 55693,
          peerIp: "203.0.113.2",
          peerPort: 5355,
          state: 0,
          lastTime: 293,
          dpdk: 0,
        },
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
