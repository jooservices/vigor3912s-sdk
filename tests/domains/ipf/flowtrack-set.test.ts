import { describe, expect, it } from "vitest";

import { ipfFlowtrackSet } from "../../../src/domains/ipf.js";
import { parseFlowtrackSet } from "../../../src/internal/parsers/ipf/flowtrack-set.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Current flowtrack ON\n";

describe("cli.ipf.flowtrack.set", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(ipfFlowtrackSet.buildFrames({ action: "enable" }));

    expect(frame.command).toBe("ipf flowtrack set -e");
    expect(firstFrame(ipfFlowtrackSet.buildFrames({ action: "refresh" })).command).toBe(
      "ipf flowtrack set -r",
    );
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseFlowtrackSet(SAMPLE_TEXT)).toEqual({
      raw: "Current flowtrack ON",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipfFlowtrackSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipfFlowtrackSet.buildFrames({ action: "enable" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Current flowtrack ON");

    expect(ipfFlowtrackSet.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Current flowtrack ON",
    });

    await expectClosedTransportFailure(command);
  });
});
