import { describe, expect, it } from "vitest";

import { msubnetMtu } from "../../../src/domains/msubnet.js";
import { parseMtu } from "../../../src/internal/parsers/msubnet/mtu.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.mtu -- msubnet mtu", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetMtu.buildFrames({ interfaceName: "LAN1", mtuValue: 1492 }));

    expect(frame.command).toBe("msubnet mtu LAN1 1492");

    expect(() => msubnetMtu.buildFrames({ interfaceName: "LAN101", mtuValue: 1492 })).toThrow(
      /interfaceName/,
    );
    expect(() =>
      msubnetMtu.buildFrames({ interfaceName: "IP_Routed_Subnet", mtuValue: 999 }),
    ).toThrow(/mtuValue/);
  });

  it("accepts the documented non-numeric interface names", () => {
    expect(
      firstFrame(msubnetMtu.buildFrames({ interfaceName: "IP_Routed_Subnet", mtuValue: 1500 }))
        .command,
    ).toBe("msubnet mtu IP_Routed_Subnet 1500");
    expect(
      firstFrame(msubnetMtu.buildFrames({ interfaceName: "DMZ", mtuValue: 1500 })).command,
    ).toBe("msubnet mtu DMZ 1500");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMtu("LAN1 MTU:             1492 (Bytes)\n")).toEqual({
      raw: "LAN1 MTU:             1492 (Bytes)",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetMtu, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetMtu.buildFrames({ interfaceName: "LAN1", mtuValue: 1492 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "LAN1 MTU:             1492 (Bytes)\n",
    );

    expect(stdout).toBe("LAN1 MTU:             1492 (Bytes)\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "LAN1 MTU:             1492 (Bytes)\n";

    expect(msubnetMtu.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseMtu(sampleText));
  });
});
