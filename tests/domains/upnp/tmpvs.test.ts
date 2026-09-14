import { describe, expect, it } from "vitest";

import { upnpTmpvs } from "../../../src/domains/upnp.js";
import { parseTmpvs } from "../../../src/internal/parsers/upnp/tmpvs.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Temp virtual server status\n";

describe("cli.upnp.tmpvs", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(upnpTmpvs.buildFrames(undefined));

    expect(frame.command).toBe("upnp tmpvs");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseTmpvs(SAMPLE_TEXT)).toEqual({
      raw: "Temp virtual server status",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(upnpTmpvs, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(upnpTmpvs.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(upnpTmpvs.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Temp virtual server status",
    });

    await expectClosedTransportFailure(command);
  });
});
