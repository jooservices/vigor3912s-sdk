import { describe, expect, it } from "vitest";

import { logH } from "../../../src/domains/log.js";
import { parseH } from "../../../src/internal/parsers/log/h.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = [
  "Usage:",
  "log [-cfhiptwx?] [-F a| c | f | w]",
  "-c  show the latest call log",
  "",
].join("\n");

describe("cli.log.h -- log -h (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = logH.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("log -h");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseH(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(logH, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      firstFrame(logH.buildFrames(undefined)).command,
      SAMPLE_TEXT,
    );

    expect(logH.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure("log -h");
  });
});
