import { describe, expect, it } from "vitest";

import { wanDfCheck } from "../../../src/domains/wan.js";
import { parseDfCheck } from "../../../src/internal/parsers/wan/dfcheck.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "%DF bit check enable!\n";

describe("cli.wan.dfcheck", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(wanDfCheck.buildFrames({ enabled: true }));

    expect(frame.command).toBe("wan DF_check on");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseDfCheck(SAMPLE_TEXT)).toEqual({
      raw: "%DF bit check enable!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanDfCheck, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanDfCheck.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "%DF bit check enable!");

    expect(stdout).toBe("%DF bit check enable!");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanDfCheck.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseDfCheck(SAMPLE_TEXT),
    );
  });

  it("builds the disabled variant", () => {
    const frame = firstFrame(wanDfCheck.buildFrames({ enabled: false }));

    expect(frame.command).toBe("wan DF_check off");
  });
});
