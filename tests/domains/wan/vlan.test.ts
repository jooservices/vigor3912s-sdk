import { describe, expect, it } from "vitest";

import { wanVlan } from "../../../src/domains/wan.js";
import { parseVlan } from "../../../src/internal/parsers/wan/vlan.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.vlan -- wan vlan wan <#> tag|enable/disable|pri (rawLine 11191)", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    const priorityFrame = firstFrame(
      wanVlan.buildFrames({ wanInterface: 1, action: "priority", priority: 6 }),
    );

    expect(priorityFrame.command).toBe("wan vlan wan 1 pri 6");

    const tagFrame = firstFrame(
      wanVlan.buildFrames({ wanInterface: 1, action: "tag", tagValue: 100 }),
    );

    expect(tagFrame.command).toBe("wan vlan wan 1 tag 100");

    const stateFrame = firstFrame(
      wanVlan.buildFrames({ wanInterface: 1, action: "state", enabled: true }),
    );

    expect(stateFrame.command).toBe("wan vlan wan 1 enable");

    expect(() =>
      wanVlan.buildFrames({ wanInterface: 13, action: "priority", priority: 6 }),
    ).toThrow(/wanInterface/);
    expect(() => wanVlan.buildFrames({ wanInterface: 1, action: "priority", priority: 8 })).toThrow(
      /priority/,
    );
    expect(() => wanVlan.buildFrames({ wanInterface: 1, action: "tag", tagValue: 4096 })).toThrow(
      /tagValue/,
    );
  });

  it("parses the documented VLAN status text (synthetic sample)", () => {
    expect(parseVlan("> Set priority to 6 for WAN1\n")).toEqual({
      raw: "> Set priority to 6 for WAN1",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanVlan, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      wanVlan.buildFrames({ wanInterface: 1, action: "priority", priority: 6 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "> Set priority to 6 for WAN1");

    expect(stdout).toBe("> Set priority to 6 for WAN1");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "> Set priority to 6 for WAN1\n";

    expect(wanVlan.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseVlan(sampleText));
  });

  it("builds the disable-state variant and the sentinel -1 tag-clear variant", () => {
    const disableStateFrame = firstFrame(
      wanVlan.buildFrames({ wanInterface: 1, action: "state", enabled: false }),
    );

    expect(disableStateFrame.command).toBe("wan vlan wan 1 disable");

    // The heading documents `-1` as the tag-clear sentinel, exempted from the
    // otherwise-enforced 1-4095 `tagValue` range check.
    const clearTagFrame = firstFrame(
      wanVlan.buildFrames({ wanInterface: 1, action: "tag", tagValue: -1 }),
    );

    expect(clearTagFrame.command).toBe("wan vlan wan 1 tag -1");
  });
});
