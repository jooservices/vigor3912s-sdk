import { describe, expect, it } from "vitest";

import { wanBudget } from "../../../src/domains/wan.js";
import { parseBudget } from "../../../src/internal/parsers/wan/budget.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.budget -- wan budget wan <#> enable|disable|thres|gthres", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    const stateFrame = firstFrame(
      wanBudget.buildFrames({ wanInterface: 1, action: "state", enabled: true }),
    );

    expect(stateFrame.command).toBe("wan budget wan 1 enable");

    const mbFrame = firstFrame(
      wanBudget.buildFrames({ wanInterface: 1, action: "thresholdMb", limitMb: 500 }),
    );

    expect(mbFrame.command).toBe("wan budget wan 1 thres 500");

    const gbFrame = firstFrame(
      wanBudget.buildFrames({ wanInterface: 1, action: "thresholdGb", limitGb: 10 }),
    );

    expect(gbFrame.command).toBe("wan budget wan 1 gthres 10");

    expect(() =>
      wanBudget.buildFrames({ wanInterface: 13, action: "state", enabled: true }),
    ).toThrow(/wanInterface/);
    expect(() =>
      wanBudget.buildFrames({ wanInterface: 1, action: "thresholdMb", limitMb: 0 }),
    ).toThrow(/limitMb/);
    expect(() =>
      wanBudget.buildFrames({ wanInterface: 1, action: "thresholdGb", limitGb: -1 }),
    ).toThrow(/limitGb/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseBudget("% WAN 1 budget limit set to 10 GB\n")).toEqual({
      raw: "% WAN 1 budget limit set to 10 GB",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanBudget, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      wanBudget.buildFrames({ wanInterface: 1, action: "thresholdGb", limitGb: 10 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% WAN 1 budget limit set to 10 GB",
    );

    expect(stdout).toBe("% WAN 1 budget limit set to 10 GB");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% WAN 1 budget limit set to 10 GB\n";

    expect(wanBudget.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseBudget(sampleText));
  });

  it("builds the disable-state variant", () => {
    const disableFrame = firstFrame(
      wanBudget.buildFrames({ wanInterface: 1, action: "state", enabled: false }),
    );

    expect(disableFrame.command).toBe("wan budget wan 1 disable");
  });
});
