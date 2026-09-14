import { describe, expect, it } from "vitest";

import { vlanSubmodeStatus } from "../../../src/domains/vlan.js";
import { parseSubmodeStatus } from "../../../src/internal/parsers/vlan/submode-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% vlan subnet mode : normal mode\n";

describe("cli.vlan.submode.status", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vlanSubmodeStatus.buildFrames(undefined));

    expect(frame.command).toBe("vlan submode status");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSubmodeStatus(SAMPLE_TEXT)).toEqual({
      raw: "% vlan subnet mode : normal mode",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vlanSubmodeStatus, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanSubmodeStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% vlan subnet mode : normal mode",
    );

    expect(stdout).toBe("% vlan subnet mode : normal mode");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(vlanSubmodeStatus.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseSubmodeStatus(SAMPLE_TEXT),
    );
  });
});
