import { describe, expect, it } from "vitest";

import { vpnIke } from "../../../src/domains/vpn.js";
import { parseIke } from "../../../src/internal/parsers/vpn/ike.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.ike -- vpn ike -<q|s>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(vpnIke.buildFrames({ flag: "q" })).command).toBe("vpn ike -q");
    expect(firstFrame(vpnIke.buildFrames({ flag: "s" })).command).toBe("vpn ike -s");

    expect(() => vpnIke.buildFrames({ flag: "x" as "q" })).toThrow(/flag/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIke("IKE Memory Status and Leakage List\n\n# of free L-Buffer=95\n")).toEqual({
      raw: "IKE Memory Status and Leakage List\n\n# of free L-Buffer=95",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vpnIke, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnIke.buildFrames({ flag: "q" }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "IKE Memory Status and Leakage List\n\n# of free L-Buffer=95\n",
    );

    expect(vpnIke.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "IKE Memory Status and Leakage List\n\n# of free L-Buffer=95",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
