import { describe, expect, it } from "vitest";

import { vpnMulticast } from "../../../src/domains/vpn.js";
import { parseMulticast } from "../../../src/internal/parsers/vpn/multicast.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.multicast -- vpn Multicast set <scope> <index> <mode>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnMulticast.buildFrames({ scope: "L2l", index: 1, mode: "Pass" }));

    expect(frame.command).toBe("vpn Multicast set L2l 1 Pass");

    expect(() => vpnMulticast.buildFrames({ scope: "X" as "L2l", index: 1, mode: "Pass" })).toThrow(
      /scope/,
    );
    expect(() => vpnMulticast.buildFrames({ scope: "L2l", index: 0, mode: "Pass" })).toThrow(
      /index/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseMulticast("% Lan to Lan Profile Index [1] :\n% Status Block/Pass: [PASS]\n"),
    ).toEqual({ raw: "% Lan to Lan Profile Index [1] :\n% Status Block/Pass: [PASS]" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnMulticast, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnMulticast.buildFrames({ scope: "L2l", index: 1, mode: "Pass" }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% Lan to Lan Profile Index [1] :\n% Status Block/Pass: [PASS]\n",
    );

    expect(vpnMulticast.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Lan to Lan Profile Index [1] :\n% Status Block/Pass: [PASS]",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
