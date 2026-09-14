import { describe, expect, it } from "vitest";

import { ipIgmpSnoopMode } from "../../../src/domains/ip.js";
import { parseIgmpSnoopMode } from "../../../src/internal/parsers/ip/igmpsnoop-mode.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpsnoop.mode -- ip igmp_snoop mode", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipIgmpSnoopMode.buildFrames({ mode: "sw" })).command).toBe(
      "ip igmp_snoop mode sw",
    );
    expect(firstFrame(ipIgmpSnoopMode.buildFrames({ mode: "hw" })).command).toBe(
      "ip igmp_snoop mode hw",
    );

    expect(() => ipIgmpSnoopMode.buildFrames({ mode: "fw" as unknown as "hw" })).toThrow(/mode/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpSnoopMode("igmp snooping works on SW mode now.\n")).toEqual({
      raw: "igmp snooping works on SW mode now.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpSnoopMode, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpSnoopMode.buildFrames({ mode: "sw" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "igmp snooping works on SW mode now.\n",
    );

    expect(stdout).toBe("igmp snooping works on SW mode now.\n");

    expect(ipIgmpSnoopMode.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
