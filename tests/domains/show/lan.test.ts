import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowLan } from "../../../src/internal/parsers/show/lan.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.lan";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

// Synthetic sample, RFC 5737 placeholder addresses -- structure mirrors the
// documented table at `cli-reference-raw.txt` line 6679 (Status/IP/Mask/DHCP
// Start IP/Pool/Gateway columns), values are not device data.
const SAMPLE_TEXT = `The LAN settings:
Status   IP              Mask            DHCP Start IP        Pool Gateway
-------- --------------- --------------- ---- --------------- ---- ---------------
[V]LAN1  192.0.2.1       255.255.255.0   V    192.0.2.10      200  192.0.2.1
[X]LAN2  192.0.2.17      255.255.255.0   X    192.0.2.26      100  192.0.2.17
`;

describe("cli.show.lan operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show lan");
    // No caller-controlled input exists for this operation (TInput = never):
    // buildFrames ignores whatever is passed to it and always yields the
    // same fixed, safe frame -- there is no injection surface to construct.
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into the documented table shape", () => {
    const result = parseShowLan(SAMPLE_TEXT);

    expect(result).toEqual({
      entries: [
        {
          interfaceName: "LAN1",
          enabled: true,
          ipAddress: "192.0.2.1",
          mask: "255.255.255.0",
          dhcpEnabled: true,
          dhcpStartIp: "192.0.2.10",
          poolSize: 200,
          gateway: "192.0.2.1",
        },
        {
          interfaceName: "LAN2",
          enabled: false,
          ipAddress: "192.0.2.17",
          mask: "255.255.255.0",
          dhcpEnabled: false,
          dhcpStartIp: "192.0.2.26",
          poolSize: 100,
          gateway: "192.0.2.17",
        },
      ],
    });
  });

  it("(3) is linked to a manifest entry with classification read and status implemented", () => {
    const entry = byId(MANIFEST_ID);

    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("read");
    expect(entry?.status).toBe("implemented");
    expect(entry?.kind).toBe("cli-command");
  });

  it("(4) parses malformed/empty output to a minimal-safe empty result, not a crash", async () => {
    const operation = findOperation();

    const emptyResult = await runOperationAgainstFakeTransport(operation, "");
    expect(emptyResult).toEqual({ entries: [] });

    const malformedResult = await runOperationAgainstFakeTransport(
      operation,
      "not a table at all\nrandom garbage",
    );
    expect(malformedResult).toEqual({ entries: [] });
  });
});
