import { describe, expect, it } from "vitest";

import { wanMultifnoStatus } from "../../../src/domains/wan.js";
import { parseMultifnoStatus } from "../../../src/internal/parsers/wan/multifno-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Channel 13 uplink ifno: 3\n";

describe("cli.wan.multifno.status", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(wanMultifnoStatus.buildFrames(undefined));

    expect(frame.command).toBe("wan multifno status");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseMultifnoStatus(SAMPLE_TEXT)).toEqual({
      raw: "% Channel 13 uplink ifno: 3",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(wanMultifnoStatus, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanMultifnoStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Channel 13 uplink ifno: 3");

    expect(stdout).toBe("% Channel 13 uplink ifno: 3");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanMultifnoStatus.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseMultifnoStatus(SAMPLE_TEXT),
    );
  });
});
