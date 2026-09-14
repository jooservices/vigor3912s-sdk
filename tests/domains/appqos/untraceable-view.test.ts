import { describe, expect, it } from "vitest";

import { appqosUntraceableView } from "../../../src/domains/appqos.js";
import { parseUntraceableView } from "../../../src/internal/parsers/appqos/untraceable-view.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Untraceable AP list\\n";

describe("cli.appqos.untraceable.v -- appqos untraceable -v (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = appqosUntraceableView.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("appqos untraceable -v");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUntraceableView(SAMPLE_TEXT)).toEqual({ raw: "% Untraceable AP list\\n" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(appqosUntraceableView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(appqosUntraceableView.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(appqosUntraceableView.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual({
      raw: "% Untraceable AP list\\n",
    });
  });
});
