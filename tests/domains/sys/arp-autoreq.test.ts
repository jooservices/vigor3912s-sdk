import { describe, expect, it } from "vitest";

import { sysArpAutoReq } from "../../../src/domains/sys.js";
import { parseArpAutoReq } from "../../../src/internal/parsers/sys/arp-autoreq.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.sys.arpautoreq", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(sysArpAutoReq.buildFrames({ enabled: true }));

    expect(frame.command).toBe("sys arp_AutoReq -d 0");
  });

  it("builds the documented frame when disabled (documented -d 1 encoding)", () => {
    const frame = firstFrame(sysArpAutoReq.buildFrames({ enabled: false }));

    expect(frame.command).toBe("sys arp_AutoReq -d 1");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseArpAutoReq(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysArpAutoReq.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(sysArpAutoReq, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysArpAutoReq.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
