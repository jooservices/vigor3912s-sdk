import { describe, expect, it } from "vitest";

import { usbDevstat } from "../../../src/domains/usb.js";
import { parseDevstat } from "../../../src/internal/parsers/usb/devstat.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "USB Port1: No device\nUSB Port2: No device\n";

describe("cli.usb.devstat -- usb devstat (read-only query)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = usbDevstat.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("usb devstat");
  });

  it("parses the documented device status text (synthetic sample)", () => {
    expect(parseDevstat(SAMPLE_TEXT)).toEqual({
      ports: [
        { port: 1, status: "No device" },
        { port: 2, status: "No device" },
      ],
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(usbDevstat, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(usbDevstat.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(usbDevstat.parse([{ stdout, stderr: "" }])).toEqual({
      ports: [
        { port: 1, status: "No device" },
        { port: 2, status: "No device" },
      ],
    });

    await expectClosedTransportFailure(command);
  });

  it("parses an empty ports list when no exchange is present (defensive fallback)", () => {
    expect(usbDevstat.parse([])).toEqual({ ports: [] });
  });
});
