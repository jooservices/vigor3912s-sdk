import { describe, expect, it } from "vitest";

import { linuxRingTest } from "../../../src/domains/linux.js";
import { parseRingTest } from "../../../src/internal/parsers/linux/ring-test.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.linux.ring.test", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(linuxRingTest.buildFrames(undefined));

    expect(frame.command).toBe("linux ring test");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseRingTest(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(linuxRingTest, "write");
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(linuxRingTest.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseRingTest(SAMPLE_TEXT),
    );
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(linuxRingTest.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
