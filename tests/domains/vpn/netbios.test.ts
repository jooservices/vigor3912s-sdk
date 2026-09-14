import { describe, expect, it } from "vitest";

import { vpnNetBios } from "../../../src/domains/vpn.js";
import { parseNetBios } from "../../../src/internal/parsers/vpn/netbios.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.netbios -- vpn NetBios set <scope> <index> <mode>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnNetBios.buildFrames({ scope: "H2l", index: 1, mode: "Pass" }));

    expect(frame.command).toBe("vpn NetBios set H2l 1 Pass");

    expect(() => vpnNetBios.buildFrames({ scope: "X" as "H2l", index: 1, mode: "Pass" })).toThrow(
      /scope/,
    );
    expect(() => vpnNetBios.buildFrames({ scope: "H2l", index: 0, mode: "Pass" })).toThrow(/index/);
    expect(() =>
      vpnNetBios.buildFrames({ scope: "H2l", index: 1, mode: "Allow" as "Pass" }),
    ).toThrow(/mode/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseNetBios("% Remote Dial In Profile Index [1] :\n% NetBios Block/Pass: [PASS]\n"),
    ).toEqual({ raw: "% Remote Dial In Profile Index [1] :\n% NetBios Block/Pass: [PASS]" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnNetBios, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnNetBios.buildFrames({ scope: "H2l", index: 1, mode: "Pass" }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% Remote Dial In Profile Index [1] :\n% NetBios Block/Pass: [PASS]\n",
    );

    expect(vpnNetBios.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Remote Dial In Profile Index [1] :\n% NetBios Block/Pass: [PASS]",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
