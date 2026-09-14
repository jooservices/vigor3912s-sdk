import { describe, expect, it } from "vitest";

import { upnpSubscribe } from "../../../src/domains/upnp.js";
import { parseSubscribe } from "../../../src/internal/parsers/upnp/subscribe.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = ">>>> (1) serviceType\n";

describe("cli.upnp.subscribe", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(upnpSubscribe.buildFrames(undefined));

    expect(frame.command).toBe("upnp subscribe");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSubscribe(SAMPLE_TEXT)).toEqual({
      raw: ">>>> (1) serviceType",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(upnpSubscribe, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(upnpSubscribe.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(upnpSubscribe.parse([{ stdout, stderr: "" }])).toEqual({
      raw: ">>>> (1) serviceType",
    });

    await expectClosedTransportFailure(command);
  });
});
