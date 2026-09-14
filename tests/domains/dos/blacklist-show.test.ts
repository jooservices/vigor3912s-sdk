import { describe, expect, it } from "vitest";

import { dosBlacklistShow } from "../../../src/domains/dos.js";
import { parseBlacklistShow } from "../../../src/internal/parsers/dos/blacklist-show.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Black list:\n% (empty)\n";

describe("cli.dos.b.show -- dos -B show (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = dosBlacklistShow.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("dos -B show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseBlacklistShow(SAMPLE_TEXT)).toEqual({ raw: "% Black list:\n% (empty)" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(dosBlacklistShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(dosBlacklistShow.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(dosBlacklistShow.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Black list:\n% (empty)",
    });

    await expectClosedTransportFailure(command);
  });
});
