import { describe, expect, it } from "vitest";

import { ipIgmpSnoopSeparate } from "../../../src/domains/ip.js";
import { parseIgmpSnoopSeparate } from "../../../src/internal/parsers/ip/igmpsnoop-separate.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpsnoop.separate -- ip igmp_snoop separate", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpSnoopSeparate.buildFrames({ enabled: true })).command).toBe(
      "ip igmp_snoop separate on",
    );
    expect(firstFrame(ipIgmpSnoopSeparate.buildFrames({ enabled: false })).command).toBe(
      "ip igmp_snoop separate off",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpSnoopSeparate("IGMP snoop separate on\n")).toEqual({
      raw: "IGMP snoop separate on",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpSnoopSeparate, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpSnoopSeparate.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "IGMP snoop separate on\n");

    expect(stdout).toBe("IGMP snoop separate on\n");

    expect(ipIgmpSnoopSeparate.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
