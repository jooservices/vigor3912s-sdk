import { describe, expect, it } from "vitest";

import { sysAppStatistic } from "../../../src/domains/sys.js";
import { parseSysAppStatistic } from "../../../src/internal/parsers/sys/appstatistic.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "app hits: 42\n";

describe("cli.sys.appstatistic -- sys app_statistic", () => {
  it("builds the documented no-argument frame", () => {
    const frames = sysAppStatistic.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("sys app_statistic");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseSysAppStatistic(SAMPLE_TEXT)).toEqual({
      raw: "app hits: 42",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysAppStatistic.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "app hits: 42",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(sysAppStatistic, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysAppStatistic.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "app hits: 42");

    expect(stdout).toBe("app hits: 42");
    await expectClosedTransportFailure(command);
  });
});
