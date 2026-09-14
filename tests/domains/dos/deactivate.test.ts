import { describe, expect, it } from "vitest";

import { dosDeactivate } from "../../../src/domains/dos.js";
import { parseDeactivate } from "../../../src/internal/parsers/dos/deactivate.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "The Dos Defense system is Deactivated\n";

describe("cli.dos.d -- dos -D (write)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = dosDeactivate.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("dos -D");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDeactivate(SAMPLE_TEXT)).toEqual({ raw: "The Dos Defense system is Deactivated" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(dosDeactivate, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(dosDeactivate.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(dosDeactivate.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "The Dos Defense system is Deactivated",
    });

    await expectClosedTransportFailure(command);
  });
});
