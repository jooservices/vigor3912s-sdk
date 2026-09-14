import { describe, expect, it } from "vitest";

import { internetView } from "../../../src/domains/internet.js";
import { parseView } from "../../../src/internal/parsers/internet/view.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = [
  "WAN1 Internet Mode:PPPoE",
  "ISP Name: tcom",
  "Username: username",
  "Authentication: PAP/CHAP",
  "Idle Timeout: -1",
  "WAN IP: Dynamic IP",
  "",
].join("\n");

describe("cli.internet.v -- internet -V (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = internetView.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("internet -V");
  });

  it("parses the documented profile text (synthetic sample)", () => {
    expect(parseView(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(internetView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(internetView.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(internetView.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure(command);
  });

  it("falls back to empty text when no exchange is available", () => {
    expect(internetView.parse([])).toEqual({ raw: "" });
  });
});
