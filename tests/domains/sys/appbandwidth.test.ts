import { describe, expect, it } from "vitest";

import { sysAppBandwidth } from "../../../src/domains/sys.js";
import { parseSysAppBandwidth } from "../../../src/internal/parsers/sys/appbandwidth.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "app bw: 1Mbps\n";

describe("cli.sys.appbandwidth -- sys app_bandwidth", () => {
  it("builds the documented no-argument frame", () => {
    const frames = sysAppBandwidth.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("sys app_bandwidth");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseSysAppBandwidth(SAMPLE_TEXT)).toEqual({
      raw: "app bw: 1Mbps",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysAppBandwidth.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "app bw: 1Mbps",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(sysAppBandwidth, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysAppBandwidth.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "app bw: 1Mbps");

    expect(stdout).toBe("app bw: 1Mbps");
    await expectClosedTransportFailure(command);
  });
});
