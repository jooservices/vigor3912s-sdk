import { describe, expect, it } from "vitest";

import { objectKw } from "../../../src/domains/object.js";
import { parseKw } from "../../../src/internal/parsers/object/kw.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.kw", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectKw.buildFrames({ index: 1, name: "children" }));

    expect(frame.command).toBe("object kw obj 1 -n children");
    expect(() => objectKw.buildFrames({ index: 1, name: "" })).toThrow(/name/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseKw(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectKw, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectKw.buildFrames({ index: 1, name: "children" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectKw.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
