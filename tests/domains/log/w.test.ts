import { describe, expect, it } from "vitest";

import { logW } from "../../../src/domains/log.js";
import { parseW } from "../../../src/internal/parsers/log/w.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = [
  "25:36:25.580 ---->DHCP (WAN-5) Len = 548XID = 0x7880fdd4",
  "        Client IP      = 0.0.0.0",
  "        Your IP        = 0.0.0.0",
  "",
].join("\n");

describe("cli.log.w -- log -w (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = logW.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("log -w");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseW(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(logW, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      firstFrame(logW.buildFrames(undefined)).command,
      SAMPLE_TEXT,
    );

    expect(logW.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure("log -w");
  });
});
