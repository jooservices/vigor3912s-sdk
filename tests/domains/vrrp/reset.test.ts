import { describe, expect, it } from "vitest";

import { vrrpReset } from "../../../src/domains/vrrp.js";
import { parseVrrpReset } from "../../../src/internal/parsers/vrrp/reset.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Reset OK\n";

describe("cli.vrrp.reset -- vrrp reset", () => {
  it("builds the documented no-argument frame", () => {
    const frames = vrrpReset.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vrrp reset");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseVrrpReset(SAMPLE_TEXT)).toEqual({
      raw: "% Reset OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vrrpReset, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(vrrpReset.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(vrrpReset.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Reset OK",
    });

    await expectClosedTransportFailure(command);
  });
});
