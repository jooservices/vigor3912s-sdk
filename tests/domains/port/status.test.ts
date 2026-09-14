import { describe, expect, it } from "vitest";

import { portStatus } from "../../../src/domains/port.js";
import { parseStatus } from "../../../src/internal/parsers/port/status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Port Status:\\n% P1: AN\\n";

describe("cli.port.status -- port status (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = portStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("port status");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseStatus(SAMPLE_TEXT)).toEqual({ raw: "% Port Status:\\n% P1: AN\\n" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(portStatus, "read");
  });

  it("falls back to empty text when no exchange is returned", () => {
    expect(portStatus.parse([])).toEqual({ raw: "" });
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(portStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(portStatus.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Port Status:\\n% P1: AN\\n",
    });

    await expectClosedTransportFailure(command);
  });
});
