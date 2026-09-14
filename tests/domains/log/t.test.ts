import { describe, expect, it } from "vitest";

import { logT } from "../../../src/domains/log.js";
import { parseT } from "../../../src/internal/parsers/log/t.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = ["All logs in buffer:", "25:36:25.580 ---->DHCP (WAN-5) Len = 548", ""].join(
  "\n",
);

describe("cli.log.t -- log -t (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = logT.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("log -t");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseT(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(logT, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      firstFrame(logT.buildFrames(undefined)).command,
      SAMPLE_TEXT,
    );

    expect(logT.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure("log -t");
  });
});
