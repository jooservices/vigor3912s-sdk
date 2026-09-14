import { describe, expect, it } from "vitest";

import { switchStatus } from "../../../src/domains/switch.js";
import { parseSwitchStatus } from "../../../src/internal/parsers/switch/status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_STATUS_TEXT = [
  "External Device auto discovery status : Enable",
  "No Respond to External Device : Enable",
  "Display External Device syslog  : Enable",
  "",
].join("\n");

describe("cli.switch.status -- switch status (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = switchStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("switch status");
  });

  it("parses the documented status lines (synthetic sample)", () => {
    expect(parseSwitchStatus(SAMPLE_STATUS_TEXT)).toEqual({
      autoDiscoveryEnabled: true,
      noRespondToExternalDeviceEnabled: true,
      displaySyslogEnabled: true,
    });

    const disabledSample = [
      "External Device auto discovery status : Disable",
      "No Respond to External Device : Disable",
      "Display External Device syslog  : Disable",
    ].join("\n");

    expect(parseSwitchStatus(disabledSample)).toEqual({
      autoDiscoveryEnabled: false,
      noRespondToExternalDeviceEnabled: false,
      displaySyslogEnabled: false,
    });
  });

  it("returns all-false defaults for text that doesn't match the documented shape", () => {
    expect(parseSwitchStatus("not a status block")).toEqual({
      autoDiscoveryEnabled: false,
      noRespondToExternalDeviceEnabled: false,
      displaySyslogEnabled: false,
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(switchStatus, "read");
  });

  it("falls back to empty text when no exchange is returned", () => {
    expect(switchStatus.parse([])).toEqual({
      autoDiscoveryEnabled: false,
      noRespondToExternalDeviceEnabled: false,
      displaySyslogEnabled: false,
    });
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(switchStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_STATUS_TEXT);
    const report = switchStatus.parse([{ stdout, stderr: "" }]);

    expect(report.autoDiscoveryEnabled).toBe(true);

    await expectClosedTransportFailure(command);
  });
});
