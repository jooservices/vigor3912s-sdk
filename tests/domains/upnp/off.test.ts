import { describe, expect, it } from "vitest";

import { upnpOff } from "../../../src/domains/upnp.js";
import { parseUpnpOff } from "../../../src/internal/parsers/upnp/off.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.upnp.off -- upnp off", () => {
  it("builds the documented no-argument frame", () => {
    const frames = upnpOff.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("upnp off");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUpnpOff("UPNP say bye-bye\n")).toEqual({ raw: "UPNP say bye-bye" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(upnpOff, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(upnpOff.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "UPNP say bye-bye\n");

    expect(upnpOff.parse([{ stdout, stderr: "" }])).toEqual({ raw: "UPNP say bye-bye" });

    await expectClosedTransportFailure(command);
  });

  it("parses an empty raw string when no exchange is present (defensive fallback)", () => {
    expect(upnpOff.parse([])).toEqual({ raw: "" });
  });
});
