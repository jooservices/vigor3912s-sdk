import { describe, expect, it } from "vitest";

import { portSniffStatus } from "../../../src/domains/port.js";
import { parseSniffStatus } from "../../../src/internal/parsers/port/sniff-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Sniff: off\\n";

describe("cli.port.sniff.status -- port sniff status (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = portSniffStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("port sniff status");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSniffStatus(SAMPLE_TEXT)).toEqual({ raw: "% Sniff: off\\n" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(portSniffStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(portSniffStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(portSniffStatus.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Sniff: off\\n" });

    await expectClosedTransportFailure(command);
  });
});
