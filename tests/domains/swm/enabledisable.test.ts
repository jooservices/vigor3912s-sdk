import { describe, expect, it } from "vitest";

import { swmEnableDisable } from "../../../src/domains/swm.js";
import { parseSwmEnableDisable } from "../../../src/internal/parsers/swm/enabledisable.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.enable.disable -- swm enable / swm disable", () => {
  it("builds the documented frame for both variants and rejects invalid input", () => {
    expect(firstFrame(swmEnableDisable.buildFrames({ action: "enable" })).command).toBe(
      "swm enable",
    );
    expect(firstFrame(swmEnableDisable.buildFrames({ action: "disable" })).command).toBe(
      "swm disable",
    );

    expect(() => swmEnableDisable.buildFrames({ action: "toggle" } as never)).toThrow(/action/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseSwmEnableDisable("External Device Discovery is not enable.\nWe will enable both.\n"),
    ).toEqual({ raw: "External Device Discovery is not enable.\nWe will enable both." });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    const sample = "External Device Discovery is not enable.\nWe will enable both.\n";

    expect(swmEnableDisable.parse([exchange(sample)])).toEqual(parseSwmEnableDisable(sample));
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmEnableDisable, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmEnableDisable.buildFrames({ action: "enable" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
