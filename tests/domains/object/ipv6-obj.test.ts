import { describe, expect, it } from "vitest";

import { objectIpv6Obj } from "../../../src/domains/object.js";
import { parseIpv6Obj } from "../../../src/internal/parsers/object/ipv6-obj.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.ipv6.obj", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectIpv6Obj.buildFrames({ index: 9, name: "bruce" }));

    expect(frame.command).toBe("object ipv6 obj 9 -n bruce");
    expect(() => objectIpv6Obj.buildFrames({ index: 0, name: "bruce" })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseIpv6Obj(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectIpv6Obj, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectIpv6Obj.buildFrames({ index: 9, name: "bruce" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectIpv6Obj.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
