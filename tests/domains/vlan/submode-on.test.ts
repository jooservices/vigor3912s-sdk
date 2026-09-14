import { describe, expect, it } from "vitest";

import { vlanSubmodeOn } from "../../../src/domains/vlan.js";
import { parseSubmodeOn } from "../../../src/internal/parsers/vlan/submode-on.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.vlan.submode.on", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vlanSubmodeOn.buildFrames(undefined));

    expect(frame.command).toBe("vlan submode on");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSubmodeOn(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanSubmodeOn, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanSubmodeOn.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(vlanSubmodeOn.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseSubmodeOn(SAMPLE_TEXT),
    );
  });
});
