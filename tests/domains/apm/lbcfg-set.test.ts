import { describe, expect, it } from "vitest";

import { apmLbcfgSet } from "../../../src/domains/apm.js";
import { parseLbcfgSet } from "../../../src/internal/parsers/apm/lbcfg-set.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const VALID_INPUT = {
  enableLoadBalance: 1 as const,
  enableStationLimit: 1 as const,
  enableTrafficLimit: 1 as const,
  stationLimit: 3,
  enableUploadLimit: 1 as const,
  enableDownloadLimit: 1 as const,
  enableIdleDisassociation: 1 as const,
  enableSignalDisassociation: 1 as const,
  uploadUnit: 1 as const,
  downloadUnit: 1 as const,
  rssiThreshold: -100,
};

describe("cli.apm.lbcfg.set -- apm lbcfg set <11 fields>", () => {
  it("builds the documented frame and rejects out-of-range input", () => {
    const frame = firstFrame(apmLbcfgSet.buildFrames(VALID_INPUT));

    expect(frame.command).toBe("apm lbcfg set 1 1 1 3 1 1 1 1 1 1 -100");
    expect(() => apmLbcfgSet.buildFrames({ ...VALID_INPUT, stationLimit: 2 })).toThrow(
      /stationLimit/,
    );
    expect(() => apmLbcfgSet.buildFrames({ ...VALID_INPUT, rssiThreshold: -40 })).toThrow(
      /rssiThreshold/,
    );
  });

  it("rejects a documented 0/1 flag given an out-of-set value", () => {
    expect(() =>
      apmLbcfgSet.buildFrames({ ...VALID_INPUT, enableLoadBalance: 2 as unknown as 0 | 1 }),
    ).toThrow(/enableLoadBalance/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseLbcfgSet("% Load balance config updated.\n")).toEqual({
      raw: "% Load balance config updated.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(apmLbcfgSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmLbcfgSet.buildFrames(VALID_INPUT)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Load balance config updated.",
    );

    expect(stdout).toBe("% Load balance config updated.");
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseLbcfgSet", () => {
    expect(apmLbcfgSet.parse([exchange("% Load balance config updated.")])).toEqual(
      parseLbcfgSet("% Load balance config updated."),
    );
  });
});
