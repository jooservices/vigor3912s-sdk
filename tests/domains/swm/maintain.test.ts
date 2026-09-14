import { describe, expect, it } from "vitest";

import { swmMaintain } from "../../../src/domains/swm.js";
import { parseSwmMaintain } from "../../../src/internal/parsers/swm/maintain.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.maintain -- swm maintain reboot/reset/show", () => {
  it("builds the documented frame for every variant and rejects invalid input", () => {
    expect(
      firstFrame(swmMaintain.buildFrames({ action: "reboot", mac: "001DAA0CCD08" })).command,
    ).toBe("swm maintain reboot 001DAA0CCD08");

    expect(
      firstFrame(swmMaintain.buildFrames({ action: "reset", mac: "001DAA0CCD08" })).command,
    ).toBe("swm maintain reset 001DAA0CCD08");

    expect(firstFrame(swmMaintain.buildFrames({ action: "show" })).command).toBe(
      "swm maintain show",
    );

    expect(() => swmMaintain.buildFrames({ action: "reboot", mac: "bad" })).toThrow(/mac/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmMaintain("Preparing to reset.\n")).toEqual({ raw: "Preparing to reset." });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmMaintain.parse([exchange("Preparing to reset.\n")])).toEqual(
      parseSwmMaintain("Preparing to reset.\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmMaintain, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmMaintain.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
