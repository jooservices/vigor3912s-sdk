import { describe, expect, it } from "vitest";

import { ipIgmpSnoopPortchk } from "../../../src/domains/ip.js";
import { parseIgmpSnoopPortchk } from "../../../src/internal/parsers/ip/igmpsnoop-portchk.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpsnoop.portchk -- ip igmp_snoop portchk", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpSnoopPortchk.buildFrames({ enabled: true })).command).toBe(
      "ip igmp_snoop portchk on",
    );
    expect(firstFrame(ipIgmpSnoopPortchk.buildFrames({ enabled: false })).command).toBe(
      "ip igmp_snoop portchk off",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpSnoopPortchk("IGMP snoop portchk on\n")).toEqual({
      raw: "IGMP snoop portchk on",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpSnoopPortchk, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpSnoopPortchk.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "IGMP snoop portchk on\n");

    expect(stdout).toBe("IGMP snoop portchk on\n");

    expect(ipIgmpSnoopPortchk.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
