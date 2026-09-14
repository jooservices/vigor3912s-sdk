import { describe, expect, it } from "vitest";

import { ipIgmpSnoopAcceptlist } from "../../../src/domains/ip.js";
import { parseIgmpSnoopAcceptlist } from "../../../src/internal/parsers/ip/igmpsnoop-acceptlist.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpsnoop.acceptlist -- ip igmp_snoop acceptlist", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipIgmpSnoopAcceptlist.buildFrames({ type: 0, index: 0 })).command).toBe(
      "ip igmp_snoop acceptlist 0 0",
    );
    expect(firstFrame(ipIgmpSnoopAcceptlist.buildFrames({ type: 1, index: 10 })).command).toBe(
      "ip igmp_snoop acceptlist 1 10",
    );
    expect(firstFrame(ipIgmpSnoopAcceptlist.buildFrames({ type: 2, index: 8 })).command).toBe(
      "ip igmp_snoop acceptlist 2 8",
    );

    expect(() => ipIgmpSnoopAcceptlist.buildFrames({ type: 3 as unknown as 0, index: 0 })).toThrow(
      /type/,
    );
    expect(() => ipIgmpSnoopAcceptlist.buildFrames({ type: 1, index: 501 })).toThrow(/index/);
    expect(() => ipIgmpSnoopAcceptlist.buildFrames({ type: 2, index: 33 })).toThrow(/index/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpSnoopAcceptlist("IGMP snoop acceptlist set\n")).toEqual({
      raw: "IGMP snoop acceptlist set",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpSnoopAcceptlist, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpSnoopAcceptlist.buildFrames({ type: 0, index: 0 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "IGMP snoop acceptlist set\n");

    expect(stdout).toBe("IGMP snoop acceptlist set\n");

    expect(ipIgmpSnoopAcceptlist.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
