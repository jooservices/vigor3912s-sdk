import { describe, expect, it } from "vitest";

import { ipIgmpSnoopTable } from "../../../src/domains/ip.js";
import { parseIgmpSnoopTable } from "../../../src/internal/parsers/ip/igmpsnoop-table.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpsnoop.table -- ip igmp_snoop table", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpSnoopTable.buildFrames()).command).toBe("ip igmp_snoop table");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpSnoopTable("IGMP Snoop table\n")).toEqual({
      raw: "IGMP Snoop table",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipIgmpSnoopTable, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpSnoopTable.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "IGMP Snoop table\n");

    expect(stdout).toBe("IGMP Snoop table\n");

    expect(ipIgmpSnoopTable.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
