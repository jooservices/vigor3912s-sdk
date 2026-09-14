import { describe, expect, it } from "vitest";

import { sysEapTls } from "../../../src/domains/sys.js";
import { parseEapTls } from "../../../src/internal/parsers/sys/eap-tls.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.sys.eaptls", () => {
  it("builds the documented frame", () => {
    const frame = firstFrame(sysEapTls.buildFrames({ enabled: true }));

    expect(frame.command).toBe("sys eap_tls set 1");
  });

  it("builds the documented frame when disabled", () => {
    const frame = firstFrame(sysEapTls.buildFrames({ enabled: false }));

    expect(frame.command).toBe("sys eap_tls set 0");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseEapTls(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysEapTls.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(sysEapTls, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysEapTls.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
