import { describe, expect, it } from "vitest";

import { vpnSameSubnet } from "../../../src/domains/vpn.js";
import { parseSameSubnet } from "../../../src/internal/parsers/vpn/samesubnet.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.samesubnet -- vpn sameSubnet <param>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      vpnSameSubnet.buildFrames({ param: "-i 1 -e 1 -I 10.10.10.0 -o add" }),
    );

    expect(frame.command).toBe("vpn sameSubnet -i 1 -e 1 -I 10.10.10.0 -o add");

    expect(() => vpnSameSubnet.buildFrames({ param: "" })).toThrow(/param/);
    expect(() => vpnSameSubnet.buildFrames({ param: "-v;rm" })).toThrow(/param/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSameSubnet("Add entry Succcess!!\n")).toEqual({ raw: "Add entry Succcess!!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnSameSubnet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(
      vpnSameSubnet.buildFrames({ param: "-i 1 -e 1 -I 10.10.10.0 -o add" }),
    );
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "Add entry Succcess!!\n");

    expect(vpnSameSubnet.parse([{ stdout, stderr: "" }])).toEqual({ raw: "Add entry Succcess!!" });

    await expectClosedTransportFailure(frame.command);
  });
});
