import { describe, expect, it } from "vitest";

import { sysIface } from "../../../src/domains/sys.js";
import { parseIface } from "../../../src/internal/parsers/sys/iface.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.sys.iface", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(sysIface.buildFrames(undefined));

    expect(frame.command).toBe("sys iface");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseIface(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysIface.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(sysIface, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysIface.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
