import { describe, expect, it } from "vitest";

import { usbUserEnable } from "../../../src/domains/usb.js";
import { parseUserEnable } from "../../../src/internal/parsers/usb/user-enable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.usb.user.enable", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(usbUserEnable.buildFrames({ index: 1 }));

    expect(frame.command).toBe("usb user enable 1");
    expect(() => usbUserEnable.buildFrames({ index: 0 })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseUserEnable(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(usbUserEnable, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(usbUserEnable.buildFrames({ index: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(usbUserEnable.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "OK",
    });

    await expectClosedTransportFailure(command);
  });
});
