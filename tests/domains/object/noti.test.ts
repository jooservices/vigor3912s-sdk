import { describe, expect, it } from "vitest";

import { objectNoti } from "../../../src/domains/object.js";
import { parseNoti } from "../../../src/internal/parsers/object/noti.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.noti", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectNoti.buildFrames({ index: 1, name: "market" }));

    expect(frame.command).toBe("object noti obj 1 -n market");
    expect(() => objectNoti.buildFrames({ index: 9, name: "market" })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseNoti(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectNoti, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectNoti.buildFrames({ index: 1, name: "market" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectNoti.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
