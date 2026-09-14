import { describe, expect, it } from "vitest";

import { radiusExternalView } from "../../../src/domains/radius.js";
import { parseExternalView } from "../../../src/internal/parsers/radius/external-view.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Profile default enable comment\\n% 1       v\\n% 2\\n";

describe("cli.radius.external.view -- radius external -V (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = radiusExternalView.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("radius external -V");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseExternalView(SAMPLE_TEXT)).toEqual({
      raw: "Profile default enable comment\\n% 1       v\\n% 2\\n",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(radiusExternalView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(radiusExternalView.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(radiusExternalView.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Profile default enable comment\\n% 1       v\\n% 2\\n",
    });

    await expectClosedTransportFailure(command);
  });
});
