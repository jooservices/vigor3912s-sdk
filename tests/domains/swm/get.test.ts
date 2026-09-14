import { describe, expect, it } from "vitest";

import { swmGet } from "../../../src/domains/swm.js";
import { parseSwmGet } from "../../../src/internal/parsers/swm/get.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.get -- swm get <MAC>", () => {
  it("builds the documented frame with a required MAC and rejects invalid input", () => {
    const frame = firstFrame(swmGet.buildFrames({ mac: "001DAA0CCD08" }));

    expect(frame.command).toBe("swm get 001DAA0CCD08");

    expect(() => swmGet.buildFrames({ mac: "not-a-mac" })).toThrow(/mac/);
    expect(() => swmGet.buildFrames({ mac: "001D:AA:0CCD08" })).toThrow(/mac/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmGet("Result: [OK].\n")).toEqual({ raw: "Result: [OK]." });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmGet.parse([exchange("Result: [OK].\n")])).toEqual(parseSwmGet("Result: [OK].\n"));
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(swmGet, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmGet.buildFrames({ mac: "001DAA0CCD08" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Result: [OK].");

    expect(stdout).toBe("Result: [OK].");
    await expectClosedTransportFailure(command);
  });
});
