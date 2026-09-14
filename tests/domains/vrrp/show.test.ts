import { describe, expect, it } from "vitest";

import { vrrpShow } from "../../../src/domains/vrrp.js";
import { parseVrrpShow } from "../../../src/internal/parsers/vrrp/show.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "VRRP: disabled\n";

describe("cli.vrrp.show -- vrrp show", () => {
  it("builds the documented no-argument frame", () => {
    const frames = vrrpShow.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vrrp show");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseVrrpShow(SAMPLE_TEXT)).toEqual({
      raw: "VRRP: disabled",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vrrpShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(vrrpShow.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(vrrpShow.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "VRRP: disabled",
    });

    await expectClosedTransportFailure(command);
  });
});
