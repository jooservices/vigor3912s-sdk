import { describe, expect, it } from "vitest";

import { vlanTagged } from "../../../src/domains/vlan.js";
import { parseTagged } from "../../../src/internal/parsers/vlan/tagged.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vlan.tagged -- vlan tagged <n|unlimited|p1_untag> <on/off> (rawLine 9510)", () => {
  it("builds the documented frames for each target and rejects invalid input", () => {
    const channelFrame = firstFrame(
      vlanTagged.buildFrames({ target: "channel", channel: 5, state: "on" }),
    );

    expect(channelFrame.command).toBe("vlan tagged 5 on");

    const unlimitedFrame = firstFrame(vlanTagged.buildFrames({ target: "unlimited", state: "on" }));

    expect(unlimitedFrame.command).toBe("vlan tagged unlimited on");

    const untagFrame = firstFrame(vlanTagged.buildFrames({ target: "p1_untag", state: "off" }));

    expect(untagFrame.command).toBe("vlan tagged p1_untag off");

    expect(() => vlanTagged.buildFrames({ target: "channel", channel: 100, state: "on" })).toThrow(
      /channel/,
    );
    expect(() => vlanTagged.buildFrames({ target: "unlimited", state: "banana" as never })).toThrow(
      /state/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseTagged("Unlimited mode is ON  \n")).toEqual({ raw: "Unlimited mode is ON" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanTagged, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      vlanTagged.buildFrames({ target: "unlimited", state: "on" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Unlimited mode is ON");

    expect(stdout).toBe("Unlimited mode is ON");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(vlanTagged.parse([{ stdout: "Unlimited mode is ON  \n", stderr: "" }])).toEqual(
      parseTagged("Unlimited mode is ON  \n"),
    );
  });
});
