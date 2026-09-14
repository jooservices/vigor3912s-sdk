import { describe, expect, it } from "vitest";

import { objectIpGrp } from "../../../src/domains/object.js";
import { parseIpGrp } from "../../../src/internal/parsers/object/ip-grp.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.ip.grp", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectIpGrp.buildFrames({ index: 2, name: "First" }));

    expect(frame.command).toBe("object ip grp 2 -n First");
    expect(() => objectIpGrp.buildFrames({ index: 0, name: "First" })).toThrow(/index/);
    expect(() => objectIpGrp.buildFrames({ index: 2, name: "thisnameistoolongx" })).toThrow(/name/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseIpGrp(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectIpGrp, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectIpGrp.buildFrames({ index: 2, name: "First" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectIpGrp.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
