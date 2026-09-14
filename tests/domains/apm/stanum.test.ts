import { describe, expect, it } from "vitest";

import { apmStanum } from "../../../src/domains/apm.js";
import { parseStanum } from "../../../src/internal/parsers/apm/stanum.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = [
  "% Show the APM AP Station Number data.",
  "% apm stanum AP_Index.",
  "%     ex : apm stanum 1",
  "%          Idx Nearby(2.4/5G) Conn(2.4/5G)",
  "%           1   2   5          0   0",
  "%           2   2   5          1   0",
  "%           3   2   5          1   0",
].join("\n");

describe("cli.apm.stanum -- apm stanum <AP_Index> (read-only query)", () => {
  it("builds the documented frame and rejects non-positive input", () => {
    const frames = apmStanum.buildFrames({ apIndex: 1 });

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("apm stanum 1");

    expect(() => apmStanum.buildFrames({ apIndex: 0 })).toThrow(/apIndex/);
    expect(() => apmStanum.buildFrames({ apIndex: -1 })).toThrow(/apIndex/);
    expect(() => apmStanum.buildFrames({ apIndex: 1.5 })).toThrow(/integer/);
  });

  it("parses the documented station-count table (synthetic sample)", () => {
    expect(parseStanum(SAMPLE_TEXT)).toEqual({
      rows: [
        { index: 1, nearby24G: 2, nearby5G: 5, connected24G: 0, connected5G: 0 },
        { index: 2, nearby24G: 2, nearby5G: 5, connected24G: 1, connected5G: 0 },
        { index: 3, nearby24G: 2, nearby5G: 5, connected24G: 1, connected5G: 0 },
      ],
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(apmStanum, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmStanum.buildFrames({ apIndex: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseStanum", () => {
    expect(apmStanum.parse([exchange(SAMPLE_TEXT)])).toEqual(parseStanum(SAMPLE_TEXT));
  });
});
