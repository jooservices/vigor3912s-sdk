import { describe, expect, it } from "vitest";

import { msubnetNat } from "../../../src/domains/msubnet.js";
import { parseNat } from "../../../src/internal/parsers/msubnet/nat.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.nat -- msubnet nat", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetNat.buildFrames({ lanIndex: 2, natEnabled: false }));

    expect(frame.command).toBe("msubnet nat 2 Off");

    expect(() => msubnetNat.buildFrames({ lanIndex: 101, natEnabled: false })).toThrow(/lanIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseNat("% LAN2 Subnet is for Routing usage!\n")).toEqual({
      raw: "% LAN2 Subnet is for Routing usage!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetNat, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(msubnetNat.buildFrames({ lanIndex: 2, natEnabled: false })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% LAN2 Subnet is for Routing usage!\n",
    );

    expect(stdout).toBe("% LAN2 Subnet is for Routing usage!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% LAN2 Subnet is for Routing usage!\n";

    expect(msubnetNat.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseNat(sampleText));
  });
});
