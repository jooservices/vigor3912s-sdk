import { describe, expect, it } from "vitest";

import { linuxRingDebug } from "../../../src/domains/linux.js";
import { parseRingDebug } from "../../../src/internal/parsers/linux/ring-debug.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.linux.ring.debug", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(linuxRingDebug.buildFrames(undefined));

    expect(frame.command).toBe("linux ring debug");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseRingDebug(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(linuxRingDebug, "read");
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(linuxRingDebug.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseRingDebug(SAMPLE_TEXT),
    );
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(linuxRingDebug.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
