import { describe, expect, it } from "vitest";

import { usbTemp } from "../../../src/domains/usb.js";
import { parseTemp } from "../../../src/internal/parsers/usb/temp.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.usb.temp -- usb temp show / usb temp all_data (read-only queries)", () => {
  it("builds the documented frames for each read sub-form and rejects an unknown action", () => {
    const showFrames = usbTemp.buildFrames({ action: "show" });
    const allDataFrames = usbTemp.buildFrames({ action: "allData" });

    expect(firstFrame(showFrames).command).toBe("usb temp show");
    expect(firstFrame(allDataFrames).command).toBe("usb temp all_data");

    expect(() => usbTemp.buildFrames({ action: "bogus" as unknown as "show" })).toThrow(/action/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseTemp(" Current temperature: 35.5 C\n")).toEqual({
      raw: "Current temperature: 35.5 C",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(usbTemp, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(usbTemp.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      " Current temperature: 35.5 C\n",
    );

    expect(usbTemp.parse([{ stdout, stderr: "" }])).toEqual({ raw: "Current temperature: 35.5 C" });

    await expectClosedTransportFailure(command);
  });
});
