import { describe, expect, it } from "vitest";

import { port8021xStatus } from "../../../src/domains/port.js";
import { parseDot1xStatus } from "../../../src/internal/parsers/port/dot1x-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% 802.1x: disable\\n";

describe("cli.port.8021x.status -- port 802.1x status (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = port8021xStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("port 802.1x status");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDot1xStatus(SAMPLE_TEXT)).toEqual({ raw: "% 802.1x: disable\\n" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(port8021xStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(port8021xStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(port8021xStatus.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% 802.1x: disable\\n",
    });

    await expectClosedTransportFailure(command);
  });
});
