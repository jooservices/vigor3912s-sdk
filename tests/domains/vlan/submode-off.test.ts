import { describe, expect, it } from "vitest";

import { vlanSubmodeOff } from "../../../src/domains/vlan.js";
import { parseSubmodeOff } from "../../../src/internal/parsers/vlan/submode-off.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.vlan.submode.off", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vlanSubmodeOff.buildFrames(undefined));

    expect(frame.command).toBe("vlan submode off");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSubmodeOff(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanSubmodeOff, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanSubmodeOff.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(vlanSubmodeOff.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseSubmodeOff(SAMPLE_TEXT),
    );
  });
});
