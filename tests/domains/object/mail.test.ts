import { describe, expect, it } from "vitest";

import { objectMail } from "../../../src/domains/object.js";
import { parseMail } from "../../../src/internal/parsers/object/mail.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.mail", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectMail.buildFrames({ index: 1, name: "buyer" }));

    expect(frame.command).toBe("object mail obj 1 -n buyer");
    expect(() => objectMail.buildFrames({ index: 0, name: "buyer" })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseMail(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectMail, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectMail.buildFrames({ index: 1, name: "buyer" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectMail.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
