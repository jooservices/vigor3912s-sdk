import { describe, expect, it } from "vitest";

import { portmaptimeFlush } from "../../../src/domains/portmaptime.js";
import { parseFlush } from "../../../src/internal/parsers/portmaptime/flush.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Flush all portmaps OK\n";

describe("cli.portmaptime.f -- portmaptime -f (write)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = portmaptimeFlush.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("portmaptime -f");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseFlush(SAMPLE_TEXT)).toEqual({ raw: "% Flush all portmaps OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(portmaptimeFlush, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(portmaptimeFlush.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(portmaptimeFlush.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual({
      raw: "% Flush all portmaps OK",
    });
  });
});
