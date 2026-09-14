import { describe, expect, it } from "vitest";

import { logC } from "../../../src/domains/log.js";
import { parseC } from "../../../src/internal/parsers/log/c.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = ["Latest call log:", "25:36:25.580 CALL setup WAN-1", ""].join("\n");

describe("cli.log.c -- log -c (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = logC.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("log -c");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseC(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(logC, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      firstFrame(logC.buildFrames(undefined)).command,
      SAMPLE_TEXT,
    );

    expect(logC.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure("log -c");
  });
});
