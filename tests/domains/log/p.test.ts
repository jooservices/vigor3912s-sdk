import { describe, expect, it } from "vitest";

import { logP } from "../../../src/domains/log.js";
import { parseP } from "../../../src/internal/parsers/log/p.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = ["PPP/MP log:", "LCP ConfReq id=0x01", ""].join("\n");

describe("cli.log.p -- log -p (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = logP.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("log -p");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseP(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(logP, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      firstFrame(logP.buildFrames(undefined)).command,
      SAMPLE_TEXT,
    );

    expect(logP.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure("log -p");
  });
});
