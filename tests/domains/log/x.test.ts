import { describe, expect, it } from "vitest";

import { logX } from "../../../src/domains/log.js";
import { parseX } from "../../../src/internal/parsers/log/x.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = ["Packet body hex dump:", "0000  45 00 00 3c 1c 46 40 00", ""].join("\n");

describe("cli.log.x -- log -x (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = logX.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("log -x");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseX(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(logX, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      firstFrame(logX.buildFrames(undefined)).command,
      SAMPLE_TEXT,
    );

    expect(logX.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure("log -x");
  });
});
