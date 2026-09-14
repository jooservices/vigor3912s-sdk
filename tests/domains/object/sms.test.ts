import { describe, expect, it } from "vitest";

import { objectSms } from "../../../src/domains/object.js";
import { parseSms } from "../../../src/internal/parsers/object/sms.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.sms", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectSms.buildFrames({ index: 1, name: "CTC" }));

    expect(frame.command).toBe("object sms obj 1 -n CTC");
    expect(() => objectSms.buildFrames({ index: 11, name: "CTC" })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSms(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectSms, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectSms.buildFrames({ index: 1, name: "CTC" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectSms.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
