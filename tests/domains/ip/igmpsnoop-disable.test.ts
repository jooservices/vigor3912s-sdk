import { describe, expect, it } from "vitest";

import { ipIgmpSnoopDisable } from "../../../src/domains/ip.js";
import { parseIgmpSnoopDisable } from "../../../src/internal/parsers/ip/igmpsnoop-disable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpsnoop.disable -- ip igmp_snoop disable", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpSnoopDisable.buildFrames()).command).toBe("ip igmp_snoop disable");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseIgmpSnoopDisable(
        "%% ip igmp snooping [enable|disable|status], IGMP Snooping is Disabled.\n",
      ),
    ).toEqual({
      raw: "%% ip igmp snooping [enable|disable|status], IGMP Snooping is Disabled.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpSnoopDisable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpSnoopDisable.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "%% ip igmp snooping [enable|disable|status], IGMP Snooping is Disabled.\n",
    );

    expect(stdout).toBe(
      "%% ip igmp snooping [enable|disable|status], IGMP Snooping is Disabled.\n",
    );

    expect(ipIgmpSnoopDisable.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
