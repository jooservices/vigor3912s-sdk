import { describe, expect, it } from "vitest";

import { radiusShowLocalCer } from "../../../src/domains/radius.js";
import { parseShowLocalCer } from "../../../src/internal/parsers/radius/showlocalcer.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Local CER: present\n";

describe("cli.radius.showlocalcer -- radius show_local_cer", () => {
  it("builds the documented no-argument frame", () => {
    const frames = radiusShowLocalCer.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("radius show_local_cer");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseShowLocalCer(SAMPLE_TEXT)).toEqual({
      raw: "Local CER: present",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(radiusShowLocalCer, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(radiusShowLocalCer.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(radiusShowLocalCer.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Local CER: present",
    });

    await expectClosedTransportFailure(command);
  });
});
