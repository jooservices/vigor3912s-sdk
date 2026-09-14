import { describe, expect, it } from "vitest";

import { usbDisk } from "../../../src/domains/usb.js";
import { parseDisk } from "../../../src/internal/parsers/usb/disk.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Disk: /dev/sda1 mounted\n";

describe("cli.usb.disk -- usb disk", () => {
  it("builds the documented no-argument frame", () => {
    const frames = usbDisk.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("usb disk");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseDisk(SAMPLE_TEXT)).toEqual({
      raw: "Disk: /dev/sda1 mounted",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(usbDisk, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(usbDisk.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(usbDisk.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Disk: /dev/sda1 mounted",
    });

    await expectClosedTransportFailure(command);
  });
});
