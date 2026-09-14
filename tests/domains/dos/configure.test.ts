import { describe, expect, it } from "vitest";

import { dosConfigure } from "../../../src/domains/dos.js";
import { parseConfigure } from "../../../src/internal/parsers/dos/configure.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.dos -- dos [-s|-a|-e|-d|-P|-B|-o|-p|-l|-f|-i ...] (write)", () => {
  it("builds the documented flagged frame and rejects empty/unknown-flag input", () => {
    const frame = firstFrame(dosConfigure.buildFrames({ args: ["-s", "synflood", "50", "10"] }));

    expect(frame.command).toBe("dos -s synflood 50 10");

    expect(() => dosConfigure.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => dosConfigure.buildFrames({ args: ["-V"] })).toThrow(
      /is not one of the documented flags/,
    );
    expect(() => dosConfigure.buildFrames({ args: ["-A"] })).toThrow(
      /is not one of the documented flags/,
    );
    expect(() => dosConfigure.buildFrames({ args: ["-s", ""] })).toThrow(
      /must not be empty or whitespace-only/,
    );
    expect(() => dosConfigure.buildFrames({ args: ["-s", "has space"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseConfigure("Synflood is enabled! Threshold=50 <pke/sec> timeout=10 <pke/sec>\n"),
    ).toEqual({
      raw: "Synflood is enabled! Threshold=50 <pke/sec> timeout=10 <pke/sec>",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(dosConfigure, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      dosConfigure.buildFrames({ args: ["-s", "synflood", "50", "10"] }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Synflood is enabled! Threshold=50 <pke/sec> timeout=10 <pke/sec>\n",
    );

    expect(dosConfigure.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Synflood is enabled! Threshold=50 <pke/sec> timeout=10 <pke/sec>",
    });

    await expectClosedTransportFailure(command);
  });
});
