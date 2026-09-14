import { describe, expect, it } from "vitest";

import { sysDaylightsave } from "../../../src/domains/sys.js";
import { parseDaylightsave } from "../../../src/internal/parsers/sys/daylightsave.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.sys.daylightsave", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(sysDaylightsave.buildFrames({ enabled: true }));

    expect(frame.command).toBe("sys daylightsave -e 1");
    expect(() => sysDaylightsave.buildFrames({})).toThrow(/At least one/);
  });

  it("builds the frame when disabled", () => {
    const frame = firstFrame(sysDaylightsave.buildFrames({ enabled: false }));

    expect(frame.command).toBe("sys daylightsave -e 0");
  });

  it("builds the frame with the documented show (-v) and reset (-r) flags", () => {
    const frame = firstFrame(sysDaylightsave.buildFrames({ show: true, reset: true }));

    expect(frame.command).toBe("sys daylightsave -v -r");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseDaylightsave(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysDaylightsave.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(sysDaylightsave, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysDaylightsave.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
