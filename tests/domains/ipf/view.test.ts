import { describe, expect, it } from "vitest";

import { ipfView } from "../../../src/domains/ipf.js";
import { parseView } from "../../../src/internal/parsers/ipf/view.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_VIEW_TEXT = [
  "ipf: IP Filter: v3.3.1 (14800)",
  "Kernel: IP Filter: v3.3.1",
  "Running: yes",
  "Log Flags: 0x0 = none set",
  "Default: pass all, Logging: available",
].join("\n");

describe("cli.ipf.view -- ipf view [-VcdhrtzZ] (read)", () => {
  it("builds the documented frame with and without flags, rejecting invalid ones", () => {
    expect(firstFrame(ipfView.buildFrames(undefined)).command).toBe("ipf view");
    expect(firstFrame(ipfView.buildFrames({ flags: ["V", "d"] })).command).toBe("ipf view -V -d");

    expect(() => ipfView.buildFrames({ flags: ["x" as unknown as "V"] })).toThrow(/flag/);
    expect(() => ipfView.buildFrames({ flags: ["V", "V"] })).toThrow(/duplicates/);
  });

  it("parses the documented -V -d acknowledgement text (synthetic sample)", () => {
    expect(parseView(SAMPLE_VIEW_TEXT)).toEqual({
      version: "v3.3.1 (14800)",
      kernelVersion: "v3.3.1",
      running: true,
      logFlags: "0x0",
      logFlagsDescription: "none set",
      defaultPolicy: "pass all",
      loggingAvailable: true,
    });

    expect(parseView("not a documented shape")).toEqual({});
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipfView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipfView.buildFrames({ flags: ["V", "d"] })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_VIEW_TEXT);

    expect(ipfView.parse([{ stdout, stderr: "" }])).toEqual({
      version: "v3.3.1 (14800)",
      kernelVersion: "v3.3.1",
      running: true,
      logFlags: "0x0",
      logFlagsDescription: "none set",
      defaultPolicy: "pass all",
      loggingAvailable: true,
    });

    await expectClosedTransportFailure(command);
  });

  it("parses an empty report when no exchange is present (defensive fallback)", () => {
    expect(ipfView.parse([])).toEqual({});
  });
});
