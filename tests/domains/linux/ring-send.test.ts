import { describe, expect, it } from "vitest";

import { linuxRingSend } from "../../../src/domains/linux.js";
import { parseRingSend } from "../../../src/internal/parsers/linux/ring-send.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.linux.ring.send", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(linuxRingSend.buildFrames(undefined));

    expect(frame.command).toBe("linux ring send");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseRingSend(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(linuxRingSend, "write");
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(linuxRingSend.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseRingSend(SAMPLE_TEXT),
    );
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(linuxRingSend.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
