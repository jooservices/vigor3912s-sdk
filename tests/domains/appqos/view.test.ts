import { describe, expect, it } from "vitest";

import { appqosView } from "../../../src/domains/appqos.js";
import { parseView } from "../../../src/internal/parsers/appqos/view.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% APP QoS: Enable\\n";

describe("cli.appqos.view -- appqos view (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = appqosView.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("appqos view");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseView(SAMPLE_TEXT)).toEqual({ raw: "% APP QoS: Enable\\n" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(appqosView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(appqosView.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(appqosView.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual({
      raw: "% APP QoS: Enable\\n",
    });
  });

  it("parses an empty raw string when no exchange is present (defensive fallback)", () => {
    expect(appqosView.parse([])).toEqual({ raw: "" });
  });
});
