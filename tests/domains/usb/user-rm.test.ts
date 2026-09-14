import { describe, expect, it } from "vitest";

import { usbUserRm } from "../../../src/domains/usb.js";
import { parseUserRm } from "../../../src/internal/parsers/usb/user-rm.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.usb.user.rm", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(usbUserRm.buildFrames({ index: 1 }));

    expect(frame.command).toBe("usb user rm 1");
    expect(() => usbUserRm.buildFrames({ index: 0 })).toThrow(/index/);
    expect(() => usbUserRm.buildFrames({ index: 17 })).toThrow(/index/);
  });

  it("rejects a non-integer index", () => {
    expect(() => usbUserRm.buildFrames({ index: 1.5 })).toThrow(/index must be an integer/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseUserRm(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(usbUserRm, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(usbUserRm.buildFrames({ index: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(usbUserRm.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "OK",
    });

    await expectClosedTransportFailure(command);
  });
});
