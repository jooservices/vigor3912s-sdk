import { describe, expect, it } from "vitest";

import { sysInfo } from "../../../src/domains/sys.js";
import { parseSysInfo } from "../../../src/internal/parsers/sys/info.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "Router info summary\n";

describe("cli.sys.info -- sys info", () => {
  it("builds the documented no-argument frame", () => {
    const frames = sysInfo.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("sys info");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseSysInfo(SAMPLE_TEXT)).toEqual({
      raw: "Router info summary",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysInfo.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "Router info summary",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(sysInfo, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysInfo.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Router info summary");

    expect(stdout).toBe("Router info summary");
    await expectClosedTransportFailure(command);
  });
});
