import { describe, expect, it } from "vitest";

import { linuxRingSet } from "../../../src/domains/linux.js";
import { parseRingSet } from "../../../src/internal/parsers/linux/ring-set.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.linux.ring.set", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(linuxRingSet.buildFrames(undefined));

    expect(frame.command).toBe("linux ring set");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseRingSet(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(linuxRingSet, "write");
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(linuxRingSet.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseRingSet(SAMPLE_TEXT),
    );
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(linuxRingSet.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
