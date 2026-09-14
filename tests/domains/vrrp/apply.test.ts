import { describe, expect, it } from "vitest";

import { vrrpApply } from "../../../src/domains/vrrp.js";
import { parseVrrpApply } from "../../../src/internal/parsers/vrrp/apply.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Apply OK\n";

describe("cli.vrrp.apply -- vrrp apply", () => {
  it("builds the documented no-argument frame", () => {
    const frames = vrrpApply.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vrrp apply");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseVrrpApply(SAMPLE_TEXT)).toEqual({
      raw: "% Apply OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vrrpApply, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(vrrpApply.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(vrrpApply.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Apply OK",
    });

    await expectClosedTransportFailure(command);
  });
});
