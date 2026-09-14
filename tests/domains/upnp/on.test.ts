import { describe, expect, it } from "vitest";

import { upnpOn } from "../../../src/domains/upnp.js";
import { parseUpnpOn } from "../../../src/internal/parsers/upnp/on.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.upnp.on -- upnp on", () => {
  it("builds the documented no-argument frame", () => {
    const frames = upnpOn.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("upnp on");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUpnpOn("UPNP start.\n")).toEqual({ raw: "UPNP start." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(upnpOn, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(upnpOn.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "UPNP start.\n");

    expect(upnpOn.parse([{ stdout, stderr: "" }])).toEqual({ raw: "UPNP start." });

    await expectClosedTransportFailure(command);
  });
});
