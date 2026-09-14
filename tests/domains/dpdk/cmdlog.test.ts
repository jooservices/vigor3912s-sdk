import { describe, expect, it } from "vitest";

import { dpdkCmdlog } from "../../../src/domains/dpdk.js";
import { parseDpdkCmdlog } from "../../../src/internal/parsers/dpdk/cmdlog.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "cmd1 ok\ncmd2 ok\n";

describe("cli.dpdk.cmdlog -- dpdk cmdlog", () => {
  it("builds the documented no-argument frame", () => {
    const frames = dpdkCmdlog.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("dpdk cmdlog");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseDpdkCmdlog(SAMPLE_TEXT)).toEqual({
      raw: "cmd1 ok\ncmd2 ok",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(dpdkCmdlog, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(dpdkCmdlog.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(dpdkCmdlog.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual({
      raw: "cmd1 ok\ncmd2 ok",
    });
  });

  it("parses an empty raw string when no exchange is present (defensive fallback)", () => {
    expect(dpdkCmdlog.parse([])).toEqual({ raw: "" });
  });
});
