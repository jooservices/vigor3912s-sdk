import { describe, expect, it } from "vitest";

import { ipIgmpSnoopStatus } from "../../../src/domains/ip.js";
import { parseIgmpSnoopStatus } from "../../../src/internal/parsers/ip/igmpsnoop-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpsnoop.status -- ip igmp_snoop status", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpSnoopStatus.buildFrames()).command).toBe("ip igmp_snoop status");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseIgmpSnoopStatus(
        "%% ip igmp snooping [enable|disable|status], IGMP Snooping is Enabled.\n",
      ),
    ).toEqual({
      raw: "%% ip igmp snooping [enable|disable|status], IGMP Snooping is Enabled.",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipIgmpSnoopStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpSnoopStatus.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "%% ip igmp snooping [enable|disable|status], IGMP Snooping is Enabled.\n",
    );

    expect(stdout).toBe("%% ip igmp snooping [enable|disable|status], IGMP Snooping is Enabled.\n");

    expect(ipIgmpSnoopStatus.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
