import { describe, expect, it } from "vitest";

import { switchOn } from "../../../src/domains/switch.js";
import { parseOn } from "../../../src/internal/parsers/switch/on.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.switch.on -- switch on (write, bare form)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = switchOn.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("switch on");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOn("Enable Extrnal Device auto discovery!\n")).toEqual({
      raw: "Enable Extrnal Device auto discovery!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(switchOn, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(switchOn.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Enable Extrnal Device auto discovery!\n",
    );

    expect(switchOn.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Enable Extrnal Device auto discovery!",
    });

    await expectClosedTransportFailure(command);
  });
});
