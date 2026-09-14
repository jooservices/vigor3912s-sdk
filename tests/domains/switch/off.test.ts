import { describe, expect, it } from "vitest";

import { switchOff } from "../../../src/domains/switch.js";
import { parseOff } from "../../../src/internal/parsers/switch/off.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.switch.off -- switch off (write, bare form)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = switchOff.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("switch off");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOff("Disable External Device auto discovery!\n")).toEqual({
      raw: "Disable External Device auto discovery!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(switchOff, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(switchOff.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Disable External Device auto discovery!\n",
    );

    expect(switchOff.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Disable External Device auto discovery!",
    });

    await expectClosedTransportFailure(command);
  });
});
