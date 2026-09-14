import { describe, expect, it } from "vitest";

import { radiusShow } from "../../../src/domains/radius.js";
import { parseShow } from "../../../src/internal/parsers/radius/show.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% RADIUS server: enable\\n% authport: 1812\\n";

describe("cli.radius.show -- radius show (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = radiusShow.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("radius show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseShow(SAMPLE_TEXT)).toEqual({
      raw: "% RADIUS server: enable\\n% authport: 1812\\n",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(radiusShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(radiusShow.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(radiusShow.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% RADIUS server: enable\\n% authport: 1812\\n",
    });

    await expectClosedTransportFailure(command);
  });

  it("parses an empty raw string when no exchange is present (defensive fallback)", () => {
    expect(radiusShow.parse([])).toEqual({ raw: "" });
  });
});
