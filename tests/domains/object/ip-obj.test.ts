import { describe, expect, it } from "vitest";

import { objectIpObjView } from "../../../src/domains/object.js";
import { parseIpObjView } from "../../../src/internal/parsers/object/ip-obj.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = [
  " IP Object Profile 1",
  " Name   :[marketing]",
  " Interface:[Any]",
  " Address type:[single]",
  " Start ip address:[192.168.1.45]",
  " End/Mask ip address:[0.0.0.0]",
  " MAC Address:[00:00:00:00:00:00]",
  " Invert Selection:[0]",
].join("\n");

describe("cli.object.ip.obj -- object ip obj INDEX -v (read-only query)", () => {
  it("builds the documented view frame and rejects out-of-range input", () => {
    const frames = objectIpObjView.buildFrames({ index: 1 });

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("object ip obj 1 -v");

    expect(() => objectIpObjView.buildFrames({ index: 0 })).toThrow(/index/);
    expect(() => objectIpObjView.buildFrames({ index: 256 })).toThrow(/index/);
    expect(() => objectIpObjView.buildFrames({ index: 1.5 })).toThrow(/integer/);
  });

  it("parses the documented profile view text (synthetic sample)", () => {
    expect(parseIpObjView(SAMPLE_TEXT)).toEqual({
      profileIndex: 1,
      name: "marketing",
      interfaceName: "Any",
      addressType: "single",
      startIpAddress: "192.168.1.45",
      endMaskIpAddress: "0.0.0.0",
      macAddress: "00:00:00:00:00:00",
      invertSelection: "0",
    });
  });

  it("returns null fields for text that doesn't match the documented shape", () => {
    expect(parseIpObjView("not an ip object profile view")).toEqual({
      profileIndex: null,
      name: null,
      interfaceName: null,
      addressType: null,
      startIpAddress: null,
      endMaskIpAddress: null,
      macAddress: null,
      invertSelection: null,
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(objectIpObjView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectIpObjView.buildFrames({ index: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectIpObjView.parse([{ stdout, stderr: "" }])).toEqual({
      profileIndex: 1,
      name: "marketing",
      interfaceName: "Any",
      addressType: "single",
      startIpAddress: "192.168.1.45",
      endMaskIpAddress: "0.0.0.0",
      macAddress: "00:00:00:00:00:00",
      invertSelection: "0",
    });

    await expectClosedTransportFailure(command);
  });
});
