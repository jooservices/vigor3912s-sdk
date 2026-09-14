import { describe, expect, it } from "vitest";

import { sysFtpd } from "../../../src/domains/sys.js";
import { parseFtpd } from "../../../src/internal/parsers/sys/ftpd.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.sys.ftpd", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(sysFtpd.buildFrames({ enabled: true }));

    expect(frame.command).toBe("sys ftpd on");
  });

  it("builds the documented frame when disabled", () => {
    const frame = firstFrame(sysFtpd.buildFrames({ enabled: false }));

    expect(frame.command).toBe("sys ftpd off");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseFtpd(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysFtpd.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(sysFtpd, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysFtpd.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
