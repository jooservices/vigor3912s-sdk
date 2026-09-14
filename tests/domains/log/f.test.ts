import { describe, expect, it } from "vitest";

import { logF } from "../../../src/domains/log.js";
import { parseF } from "../../../src/internal/parsers/log/f.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = ["IP filter log:", "DROP tcp 192.0.2.10:443 -> 198.51.100.5:51234", ""].join(
  "\n",
);

describe("cli.log.f -- log -f (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = logF.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("log -f");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseF(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(logF, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      firstFrame(logF.buildFrames(undefined)).command,
      SAMPLE_TEXT,
    );

    expect(logF.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure("log -f");
  });
});
