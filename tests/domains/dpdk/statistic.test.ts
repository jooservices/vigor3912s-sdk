import { describe, expect, it } from "vitest";

import { dpdkStatistic } from "../../../src/domains/dpdk.js";
import { parseDpdkStatistic } from "../../../src/internal/parsers/dpdk/statistic.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "rx_packets: 10\ntx_packets: 8\n";

describe("cli.dpdk.statistic -- dpdk statistic", () => {
  it("builds the documented no-argument frame", () => {
    const frames = dpdkStatistic.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("dpdk statistic");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseDpdkStatistic(SAMPLE_TEXT)).toEqual({
      raw: "rx_packets: 10\ntx_packets: 8",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(dpdkStatistic, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(dpdkStatistic.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(dpdkStatistic.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual({
      raw: "rx_packets: 10\ntx_packets: 8",
    });
  });

  it("parses an empty raw string when no exchange is present (defensive fallback)", () => {
    expect(dpdkStatistic.parse([])).toEqual({ raw: "" });
  });
});
