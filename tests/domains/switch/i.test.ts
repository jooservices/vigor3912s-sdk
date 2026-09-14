import { describe, expect, it } from "vitest";

import { switchI } from "../../../src/domains/switch.js";
import { parseSwitchI } from "../../../src/internal/parsers/switch/i.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "External Device NO. 1 traffic statistic function is enable\n";

describe("cli.switch.i", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(switchI.buildFrames({ index: 1, traffic: "on" }));

    expect(frame.command).toBe("switch -i 1 traffic on");
    expect(() => switchI.buildFrames({ index: 0, traffic: "on" })).toThrow(/index/);
    expect(() => switchI.buildFrames({ index: 1.5, traffic: "on" })).toThrow(/must be an integer/);
    expect(() => switchI.buildFrames({ index: 1, traffic: "nope" as "on" })).toThrow(/traffic/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSwitchI(SAMPLE_TEXT)).toEqual({
      raw: "External Device NO. 1 traffic statistic function is enable",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(switchI, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(switchI.buildFrames({ index: 1, traffic: "on" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(switchI.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "External Device NO. 1 traffic statistic function is enable",
    });

    await expectClosedTransportFailure(command);
  });
});
