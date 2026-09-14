import { describe, expect, it } from "vitest";

import { usbUserList } from "../../../src/domains/usb.js";
import { parseUserList } from "../../../src/internal/parsers/usb/user-list.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "1 root /usr\n";

describe("cli.usb.user.list", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(usbUserList.buildFrames(undefined));

    expect(frame.command).toBe("usb user list");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseUserList(SAMPLE_TEXT)).toEqual({
      raw: "1 root /usr",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(usbUserList, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(usbUserList.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(usbUserList.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "1 root /usr",
    });

    await expectClosedTransportFailure(command);
  });
});
