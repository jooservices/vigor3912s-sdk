import { describe, expect, it } from "vitest";

import { usbUserDisable } from "../../../src/domains/usb.js";
import { parseUserDisable } from "../../../src/internal/parsers/usb/user-disable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.usb.user.disable", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(usbUserDisable.buildFrames({ index: 2 }));

    expect(frame.command).toBe("usb user disable 2");
    expect(() => usbUserDisable.buildFrames({ index: 17 })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseUserDisable(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(usbUserDisable, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(usbUserDisable.buildFrames({ index: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(usbUserDisable.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "OK",
    });

    await expectClosedTransportFailure(command);
  });
});
