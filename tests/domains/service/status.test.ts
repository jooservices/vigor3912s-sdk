import { describe, expect, it } from "vitest";

import { serviceStatus } from "../../../src/domains/service.js";
import { parseStatus } from "../../../src/internal/parsers/service/status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = [
  "Show service status.",
  "Now state is [SS_STATE_REG_ACC_VALID]",
  "Service Status:",
  "Model Name   : Vigor3912 Series",
  "Owner Account: carrieni",
  "",
].join("\n");

describe("cli.service -- service -s (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = serviceStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("service -s");
  });

  it("parses the documented status dump (synthetic sample)", () => {
    expect(parseStatus(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(serviceStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(serviceStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(serviceStatus.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure(command);
  });
});
