import { describe, expect, it } from "vitest";

import { vpnFromlanRemove } from "../../../src/domains/vpn.js";
import { parseFromlanRemove } from "../../../src/internal/parsers/vpn/fromlanremove.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.fromlan.remove -- vpn fromlan remove <lanx>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnFromlanRemove.buildFrames({ lan: "lan3" }));

    expect(frame.command).toBe("vpn fromlan remove lan3");

    expect(() => vpnFromlanRemove.buildFrames({ lan: "lan1" })).toThrow(/lan/);
    expect(() => vpnFromlanRemove.buildFrames({ lan: "lan0" })).toThrow(/lan/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseFromlanRemove("% fromlan remove OK\n")).toEqual({ raw: "% fromlan remove OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnFromlanRemove, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnFromlanRemove.buildFrames({ lan: "lan3" }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% fromlan remove OK\n");

    expect(vpnFromlanRemove.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% fromlan remove OK",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
