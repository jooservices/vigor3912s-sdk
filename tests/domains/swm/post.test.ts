import { describe, expect, it } from "vitest";

import { swmPost } from "../../../src/domains/swm.js";
import { parseSwmPost } from "../../../src/internal/parsers/swm/post.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.post -- swm post <MAC>", () => {
  it("builds the documented frame with a required MAC and rejects invalid input", () => {
    const frame = firstFrame(swmPost.buildFrames({ mac: "001DAA0CCD08" }));

    expect(frame.command).toBe("swm post 001DAA0CCD08");

    expect(() => swmPost.buildFrames({ mac: "zzzzzzzzzzzz" })).toThrow(/mac/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmPost("Result: [OK]. \n")).toEqual({ raw: "Result: [OK]." });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmPost.parse([exchange("Result: [OK]. \n")])).toEqual(parseSwmPost("Result: [OK]. \n"));
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmPost, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmPost.buildFrames({ mac: "001DAA0CCD08" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Result: [OK].");

    expect(stdout).toBe("Result: [OK].");
    await expectClosedTransportFailure(command);
  });
});
