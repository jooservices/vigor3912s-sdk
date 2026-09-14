import { describe, expect, it } from "vitest";

import { vlanSubnet } from "../../../src/domains/vlan.js";
import { parseSubnet } from "../../../src/internal/parsers/vlan/subnet.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vlan.subnet -- vlan subnet group_id <n> (rawLine 9462)", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vlanSubnet.buildFrames({ lanInterface: 2 }));

    expect(frame.command).toBe("vlan subnet group_id 2");

    expect(() => vlanSubnet.buildFrames({ lanInterface: 0 })).toThrow(/lanInterface/);
    expect(() => vlanSubnet.buildFrames({ lanInterface: 101 })).toThrow(/lanInterface/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseSubnet(
        "% Vlan Group-0 using LAN2       !\n\n This setting will take effect after rebooting.\n",
      ),
    ).toEqual({
      raw: "% Vlan Group-0 using LAN2       !\n\n This setting will take effect after rebooting.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanSubnet, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanSubnet.buildFrames({ lanInterface: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Vlan Group-0 using LAN2       !",
    );

    expect(stdout).toBe("% Vlan Group-0 using LAN2       !");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Vlan Group-0 using LAN2       !";

    expect(vlanSubnet.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseSubnet(sampleText));
  });
});
