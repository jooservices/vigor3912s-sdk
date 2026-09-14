import { describe, expect, it } from "vitest";

import { objectServiceGrp } from "../../../src/domains/object.js";
import { parseServiceGrp } from "../../../src/internal/parsers/object/service-grp.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.service.grp", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectServiceGrp.buildFrames({ index: 1, name: "Grope_1" }));

    expect(frame.command).toBe("object service grp 1 -n Grope_1");
    expect(() => objectServiceGrp.buildFrames({ index: 0, name: "Grope_1" })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseServiceGrp(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectServiceGrp, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectServiceGrp.buildFrames({ index: 1, name: "Grope_1" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectServiceGrp.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
