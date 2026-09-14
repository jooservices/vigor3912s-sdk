import { describe, expect, it } from "vitest";

import { radiusExternalViewProfile } from "../../../src/domains/radius.js";
import { parseExternalViewProfile } from "../../../src/internal/parsers/radius/external-view-profile.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.radius.external.viewprofile -- radius external -v <index> (read)", () => {
  it("builds the documented profile-view frame and rejects invalid indexes", () => {
    expect(firstFrame(radiusExternalViewProfile.buildFrames({ profileIndex: 1 })).command).toBe(
      "radius external -v 1",
    );

    expect(() => radiusExternalViewProfile.buildFrames({ profileIndex: 0 })).toThrow(
      /profileIndex/,
    );
  });

  it("parses the documented profile text (synthetic sample)", () => {
    expect(parseExternalViewProfile("% profile 1 details\n")).toEqual({
      raw: "% profile 1 details",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(radiusExternalViewProfile, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(radiusExternalViewProfile.buildFrames({ profileIndex: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% profile 1 details\n");

    expect(radiusExternalViewProfile.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% profile 1 details",
    });

    await expectClosedTransportFailure(command);
  });
});
