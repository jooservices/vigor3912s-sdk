import { describe, expect, it } from "vitest";

import { swmProfile } from "../../../src/domains/swm.js";
import { parseSwmProfile } from "../../../src/internal/parsers/swm/profile.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.profile -- swm profile add/delete/show/enable_all/disable_all", () => {
  it("builds the documented frame for every variant and rejects invalid input", () => {
    expect(firstFrame(swmProfile.buildFrames({ action: "add", mac: "001DAA0CCD08" })).command).toBe(
      "swm profile add 001DAA0CCD08",
    );

    expect(
      firstFrame(swmProfile.buildFrames({ action: "delete", mac: "001DAA0CCD08" })).command,
    ).toBe("swm profile delete 001DAA0CCD08");

    expect(firstFrame(swmProfile.buildFrames({ action: "show" })).command).toBe("swm profile show");

    expect(
      firstFrame(swmProfile.buildFrames({ action: "enableAll", mac: "001DAA0CCD08" })).command,
    ).toBe("swm profile enable_all 001DAA0CCD08");

    expect(
      firstFrame(swmProfile.buildFrames({ action: "disableAll", mac: "001DAA0CCD08" })).command,
    ).toBe("swm profile disable_all 001DAA0CCD08");

    expect(() => swmProfile.buildFrames({ action: "add", mac: "bad" })).toThrow(/mac/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmProfile("> swm profile show\n")).toEqual({ raw: "> swm profile show" });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmProfile.parse([exchange("> swm profile show\n")])).toEqual(
      parseSwmProfile("> swm profile show\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmProfile, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmProfile.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
