import { describe, expect, it } from "vitest";

import { vlanRestart } from "../../../src/domains/vlan.js";
import { parseRestart } from "../../../src/internal/parsers/vlan/restart.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.vlan.restart", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vlanRestart.buildFrames(undefined));

    expect(frame.command).toBe("vlan restart");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseRestart(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanRestart, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanRestart.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(vlanRestart.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseRestart(SAMPLE_TEXT),
    );
  });
});
