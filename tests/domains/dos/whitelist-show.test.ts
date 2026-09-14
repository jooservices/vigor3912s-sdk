import { describe, expect, it } from "vitest";

import { dosWhitelistShow } from "../../../src/domains/dos.js";
import { parseWhitelistShow } from "../../../src/internal/parsers/dos/whitelist-show.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% White list:\n% (empty)\n";

describe("cli.dos.p.show -- dos -P show (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = dosWhitelistShow.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("dos -P show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseWhitelistShow(SAMPLE_TEXT)).toEqual({ raw: "% White list:\n% (empty)" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(dosWhitelistShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(dosWhitelistShow.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(dosWhitelistShow.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% White list:\n% (empty)",
    });

    await expectClosedTransportFailure(command);
  });
});
