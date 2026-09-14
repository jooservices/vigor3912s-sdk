import { describe, expect, it } from "vitest";

import { vpnGraph } from "../../../src/domains/vpn.js";
import { parseGraph } from "../../../src/internal/parsers/vpn/graph.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "VPN graph: idle\n";

describe("cli.vpn.graph -- vpn graph", () => {
  it("builds the documented no-argument frame", () => {
    const frames = vpnGraph.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vpn graph");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseGraph(SAMPLE_TEXT)).toEqual({
      raw: "VPN graph: idle",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vpnGraph, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnGraph.buildFrames(undefined));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, SAMPLE_TEXT);

    expect(vpnGraph.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "VPN graph: idle",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
