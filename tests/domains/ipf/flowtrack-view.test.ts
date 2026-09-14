import { describe, expect, it } from "vitest";

import { ipfFlowtrackView } from "../../../src/domains/ipf.js";
import { parseFlowtrackView } from "../../../src/internal/parsers/ipf/flowtrack-view.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "session state\n";

describe("cli.ipf.flowtrack.view", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(ipfFlowtrackView.buildFrames({ mode: "sessions" }));

    expect(frame.command).toBe("ipf flowtrack view -f");
    expect(firstFrame(ipfFlowtrackView.buildFrames({ mode: "all" })).command).toBe(
      "ipf flowtrack view -b",
    );
    expect(() => ipfFlowtrackView.buildFrames({ mode: "nope" as "sessions" })).toThrow(/mode/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseFlowtrackView(SAMPLE_TEXT)).toEqual({
      raw: "session state",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipfFlowtrackView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipfFlowtrackView.buildFrames({ mode: "sessions" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "session state");

    expect(ipfFlowtrackView.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "session state",
    });

    await expectClosedTransportFailure(command);
  });
});
