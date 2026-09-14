import { describe, expect, it } from "vitest";

import { local8021xShow } from "../../../src/domains/local_8021x.js";
import { parseShow } from "../../../src/internal/parsers/local_8021x/show.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Local 802.1X enable: disable\n";

describe("cli.local8021x -- local_8021x show (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = local8021xShow.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("local_8021x show");
  });

  it("parses the documented enable/disable line (synthetic sample)", () => {
    expect(parseShow(SAMPLE_TEXT)).toEqual({ enabled: false, raw: SAMPLE_TEXT.trim() });
    expect(parseShow("% Local 802.1X enable: enable\n")).toEqual({
      enabled: true,
      raw: "% Local 802.1X enable: enable",
    });
  });

  it("returns enabled: null for text that doesn't match the documented shape", () => {
    expect(parseShow("not a status line")).toEqual({ enabled: null, raw: "not a status line" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(local8021xShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(local8021xShow.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(local8021xShow.parse([{ stdout, stderr: "" }])).toEqual({
      enabled: false,
      raw: SAMPLE_TEXT.trim(),
    });

    await expectClosedTransportFailure(command);
  });
});
