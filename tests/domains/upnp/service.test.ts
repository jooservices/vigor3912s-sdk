import { describe, expect, it } from "vitest";

import { upnpService } from "../../../src/domains/upnp.js";
import { parseService } from "../../../src/internal/parsers/upnp/service.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "service list\n";

describe("cli.upnp.service", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(upnpService.buildFrames(undefined));

    expect(frame.command).toBe("upnp service");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseService(SAMPLE_TEXT)).toEqual({
      raw: "service list",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(upnpService, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(upnpService.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(upnpService.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "service list",
    });

    await expectClosedTransportFailure(command);
  });
});
