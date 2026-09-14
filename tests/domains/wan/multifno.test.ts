import { describe, expect, it } from "vitest";

import { wanMultifno } from "../../../src/domains/wan.js";
import { parseMultifno } from "../../../src/internal/parsers/wan/multifno.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Configured channel 13 uplink to WAN1\n";

describe("cli.wan.multifno", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(wanMultifno.buildFrames({ channel: 13, wanInterface: 1 }));

    expect(frame.command).toBe("wan multifno 13 1");
    expect(() => wanMultifno.buildFrames({ channel: 12, wanInterface: 1 })).toThrow(/channel/);
    expect(() => wanMultifno.buildFrames({ channel: 13, wanInterface: 0 })).toThrow(/wanInterface/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseMultifno(SAMPLE_TEXT)).toEqual({
      raw: "% Configured channel 13 uplink to WAN1",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanMultifno, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanMultifno.buildFrames({ channel: 13, wanInterface: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Configured channel 13 uplink to WAN1",
    );

    expect(stdout).toBe("% Configured channel 13 uplink to WAN1");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanMultifno.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseMultifno(SAMPLE_TEXT),
    );
  });
});
