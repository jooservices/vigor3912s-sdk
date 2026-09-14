import { describe, expect, it } from "vitest";

import { linuxRingClean } from "../../../src/domains/linux.js";
import { parseRingClean } from "../../../src/internal/parsers/linux/ring-clean.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.linux.ring.clean", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(linuxRingClean.buildFrames(undefined));

    expect(frame.command).toBe("linux ring clean");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseRingClean(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(linuxRingClean, "write");
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(linuxRingClean.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseRingClean(SAMPLE_TEXT),
    );
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(linuxRingClean.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
