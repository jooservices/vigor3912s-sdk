import { describe, expect, it } from "vitest";

import { switchSyslog } from "../../../src/domains/switch.js";
import { parseSyslog } from "../../../src/internal/parsers/switch/syslog.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "External Device syslog is Enable\n";

describe("cli.switch.syslog", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(switchSyslog.buildFrames({ enabled: true }));

    expect(frame.command).toBe("switch syslog on");

    const disabledFrame = firstFrame(switchSyslog.buildFrames({ enabled: false }));

    expect(disabledFrame.command).toBe("switch syslog off");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSyslog(SAMPLE_TEXT)).toEqual({
      raw: "External Device syslog is Enable",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(switchSyslog, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(switchSyslog.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(switchSyslog.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "External Device syslog is Enable",
    });

    await expectClosedTransportFailure(command);
  });
});
