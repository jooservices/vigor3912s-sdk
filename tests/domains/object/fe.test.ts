import { describe, expect, it } from "vitest";

import { objectFe } from "../../../src/domains/object.js";
import { parseFe } from "../../../src/internal/parsers/object/fe.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.fe", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectFe.buildFrames({ index: 1, name: "music" }));

    expect(frame.command).toBe("object fe obj 1 -n music");
    expect(() => objectFe.buildFrames({ index: 9, name: "music" })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseFe(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectFe, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectFe.buildFrames({ index: 1, name: "music" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectFe.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
