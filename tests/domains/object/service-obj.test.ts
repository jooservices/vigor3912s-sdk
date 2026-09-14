import { describe, expect, it } from "vitest";

import { objectServiceObjView } from "../../../src/domains/object.js";
import { parseServiceObjView } from "../../../src/internal/parsers/object/service-obj.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = [
  " Service Object Profile 1",
  " Name   :[limit]",
  " Protocol:[TCP/UDP]",
  " Source port check action:[!=]",
  " Source port range:[120~240]",
  " Destination port check action:[!=]",
  " Destination port range:[200~220]",
].join("\n");

describe("cli.object.service.obj -- object service obj INDEX -v (read-only query)", () => {
  it("builds the documented view frame and rejects out-of-range input", () => {
    const frames = objectServiceObjView.buildFrames({ index: 1 });

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("object service obj 1 -v");

    expect(() => objectServiceObjView.buildFrames({ index: 0 })).toThrow(/index/);
    expect(() => objectServiceObjView.buildFrames({ index: 256 })).toThrow(/index/);
    expect(() => objectServiceObjView.buildFrames({ index: 1.5 })).toThrow(/integer/);
  });

  it("parses the documented profile view text (synthetic sample)", () => {
    expect(parseServiceObjView(SAMPLE_TEXT)).toEqual({
      profileIndex: 1,
      name: "limit",
      protocol: "TCP/UDP",
      sourcePortCheckAction: "!=",
      sourcePortRange: "120~240",
      destinationPortCheckAction: "!=",
      destinationPortRange: "200~220",
    });
  });

  it("returns null fields for text that doesn't match the documented shape", () => {
    expect(parseServiceObjView("not a service object profile view")).toEqual({
      profileIndex: null,
      name: null,
      protocol: null,
      sourcePortCheckAction: null,
      sourcePortRange: null,
      destinationPortCheckAction: null,
      destinationPortRange: null,
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(objectServiceObjView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(objectServiceObjView.buildFrames({ index: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectServiceObjView.parse([{ stdout, stderr: "" }])).toEqual({
      profileIndex: 1,
      name: "limit",
      protocol: "TCP/UDP",
      sourcePortCheckAction: "!=",
      sourcePortRange: "120~240",
      destinationPortCheckAction: "!=",
      destinationPortRange: "200~220",
    });

    await expectClosedTransportFailure(command);
  });
});
