import { describe, expect, it } from "vitest";

import { dosActivate } from "../../../src/domains/dos.js";
import { parseActivate } from "../../../src/internal/parsers/dos/activate.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "The Dos Defense system is Activated\n";

describe("cli.dos.a -- dos -A (write)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = dosActivate.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("dos -A");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseActivate(SAMPLE_TEXT)).toEqual({ raw: "The Dos Defense system is Activated" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(dosActivate, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(dosActivate.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(dosActivate.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "The Dos Defense system is Activated",
    });

    await expectClosedTransportFailure(command);
  });
});
