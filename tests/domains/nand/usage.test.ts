import { describe, expect, it } from "vitest";

import { nandUsage } from "../../../src/domains/nand.js";
import { parseUsage } from "../../../src/internal/parsers/nand/usage.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_USAGE_TEXT = [
  "Show NAND Flash Usage:",
  "Partition    Total           Used            Available       Use%",
  "cfg           4194304         7920            4186384           0%",
  "bin_web      33554432        11869493       21684939         35%",
  "",
].join("\n");

const SAMPLE_BAD_TEXT = ["Show NAND Flash Bad Blocks:", "No bad blocks found.", ""].join("\n");

describe("cli.nand.bad.nand.usage -- nand bad / nand usage (read)", () => {
  it("builds the documented no-argument frames for each variant", () => {
    expect(firstFrame(nandUsage.buildFrames({ action: "usage" })).command).toBe("nand usage");
    expect(firstFrame(nandUsage.buildFrames({ action: "bad" })).command).toBe("nand bad");
  });

  it("parses the documented output for both variants (synthetic sample)", () => {
    expect(parseUsage(SAMPLE_USAGE_TEXT)).toEqual({ raw: SAMPLE_USAGE_TEXT.trim() });
    expect(parseUsage(SAMPLE_BAD_TEXT)).toEqual({ raw: SAMPLE_BAD_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(nandUsage, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(nandUsage.buildFrames({ action: "usage" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_USAGE_TEXT);

    expect(nandUsage.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_USAGE_TEXT.trim() });

    await expectClosedTransportFailure(command);
  });
});
