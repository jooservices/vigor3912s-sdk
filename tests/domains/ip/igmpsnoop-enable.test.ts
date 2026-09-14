import { describe, expect, it } from "vitest";

import { ipIgmpSnoopEnable } from "../../../src/domains/ip.js";
import { parseIgmpSnoopEnable } from "../../../src/internal/parsers/ip/igmpsnoop-enable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpsnoop.enable -- ip igmp_snoop enable", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpSnoopEnable.buildFrames()).command).toBe("ip igmp_snoop enable");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseIgmpSnoopEnable(
        "%% ip igmp snooping [enable|disable|status], IGMP Snooping is Enabled.\n",
      ),
    ).toEqual({
      raw: "%% ip igmp snooping [enable|disable|status], IGMP Snooping is Enabled.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpSnoopEnable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpSnoopEnable.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "%% ip igmp snooping [enable|disable|status], IGMP Snooping is Enabled.\n",
    );

    expect(stdout).toBe("%% ip igmp snooping [enable|disable|status], IGMP Snooping is Enabled.\n");

    expect(ipIgmpSnoopEnable.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
