import { describe, expect, it } from "vitest";

import { ipIgmpSnoopChkleave } from "../../../src/domains/ip.js";
import { parseIgmpSnoopChkleave } from "../../../src/internal/parsers/ip/igmpsnoop-chkleave.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpsnoop.chkleave -- ip igmp_snoop chkleave", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpSnoopChkleave.buildFrames({ enabled: true })).command).toBe(
      "ip igmp_snoop chkleave on",
    );
    expect(firstFrame(ipIgmpSnoopChkleave.buildFrames({ enabled: false })).command).toBe(
      "ip igmp_snoop chkleave off",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpSnoopChkleave("IGMP snoop chkleave on\n")).toEqual({
      raw: "IGMP snoop chkleave on",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpSnoopChkleave, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpSnoopChkleave.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "IGMP snoop chkleave on\n");

    expect(stdout).toBe("IGMP snoop chkleave on\n");

    expect(ipIgmpSnoopChkleave.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
