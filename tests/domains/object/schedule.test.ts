import { describe, expect, it } from "vitest";

import { objectSchedule } from "../../../src/domains/object.js";
import { parseSchedule } from "../../../src/internal/parsers/object/schedule.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.schedule", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectSchedule.buildFrames({ index: 1, enabled: true }));

    expect(frame.command).toBe("object schedule set 1 -e 1");
    expect(() => objectSchedule.buildFrames({ index: 16, enabled: true })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSchedule(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectSchedule, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectSchedule.buildFrames({ index: 1, enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectSchedule.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
