import { describe, expect, it } from "vitest";

import { switchClear } from "../../../src/domains/switch.js";
import { parseClear } from "../../../src/internal/parsers/switch/clear.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.switch.clear", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(switchClear.buildFrames({ index: 1 }));

    expect(frame.command).toBe("switch clear 1");
    expect(() => switchClear.buildFrames({ index: 0 })).toThrow(/index/);
    expect(() => switchClear.buildFrames({ index: 9 })).toThrow(/index/);

    const allFrame = firstFrame(switchClear.buildFrames({ all: true }));

    expect(allFrame.command).toBe("switch clear -f");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseClear(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(switchClear, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(switchClear.buildFrames({ index: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(switchClear.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "OK",
    });

    await expectClosedTransportFailure(command);
  });
});
