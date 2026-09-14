import { describe, expect, it } from "vitest";

import { objectCountry } from "../../../src/domains/object.js";
import { parseCountry } from "../../../src/internal/parsers/object/country.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.country", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectCountry.buildFrames({ index: 1, name: "Best" }));

    expect(frame.command).toBe("object country set 1 -n Best");
    expect(() => objectCountry.buildFrames({ index: 33, name: "Best" })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseCountry(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectCountry, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectCountry.buildFrames({ index: 1, name: "Best" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectCountry.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
