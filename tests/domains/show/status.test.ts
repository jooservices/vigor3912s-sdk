import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowStatus } from "../../../src/internal/parsers/show/status.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.status";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

/**
 * Literal example output block from
 * `.ai/skills/vigor3912s/references/command-map.md` (the "`show status`
 * example output" fenced block) -- explicitly permitted by this task's
 * assignment as the accepted sample source for `show status`.
 */
const COMMAND_MAP_EXAMPLE_TEXT = `System Uptime:2:8:29
LAN Status
Primary DNS:168.95.192.1      Secondary DNS:168.95.1.1
IP Address:192.168.100.1      Tx Rate:103850    Rx Rate:68112
WAN 1 Status: Disconnected
Enable:Yes       Line:Fiber       Name:
Mode:DHCP Client Up Time:0:00:00     IP:---            GW IP:---
`;

describe("cli.show.status operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show status");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses the command-map.md example block into the documented status shape", () => {
    const result = parseShowStatus(COMMAND_MAP_EXAMPLE_TEXT);

    expect(result).toEqual({
      systemUptime: "2:8:29",
      lan: {
        primaryDns: "168.95.192.1",
        secondaryDns: "168.95.1.1",
        ipAddress: "192.168.100.1",
        txRate: 103850,
        rxRate: 68112,
      },
      wans: [
        {
          index: 1,
          connectionStatus: "Disconnected",
          enabled: true,
          line: "Fiber",
          name: null,
          mode: "DHCP Client",
          upTime: "0:00:00",
          ip: null,
          gatewayIp: null,
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

  it("(4) parses malformed/empty output to a minimal-safe result, not a crash", async () => {
    const operation = findOperation();

    const emptyResult = await runOperationAgainstFakeTransport(operation, "");
    expect(emptyResult).toEqual({
      systemUptime: null,
      lan: { primaryDns: null, secondaryDns: null, ipAddress: null, txRate: null, rxRate: null },
      wans: [],
    });

    const malformedResult = await runOperationAgainstFakeTransport(operation, "garbage");
    expect(malformedResult).toEqual({
      systemUptime: null,
      lan: { primaryDns: null, secondaryDns: null, ipAddress: null, txRate: null, rxRate: null },
      wans: [],
    });
  });
});
