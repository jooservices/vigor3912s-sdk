import { describe, expect, it } from "vitest";

import { switchNotRespond } from "../../../src/domains/switch.js";
import { parseNotRespond } from "../../../src/internal/parsers/switch/notrespond.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "slave not respond!\n";

describe("cli.switch.notrespond", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(switchNotRespond.buildFrames({ enabled: true }));

    expect(frame.command).toBe("switch not_respond 1");

    const disabledFrame = firstFrame(switchNotRespond.buildFrames({ enabled: false }));

    expect(disabledFrame.command).toBe("switch not_respond 0");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseNotRespond(SAMPLE_TEXT)).toEqual({
      raw: "slave not respond!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(switchNotRespond, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(switchNotRespond.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(switchNotRespond.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "slave not respond!",
    });

    await expectClosedTransportFailure(command);
  });
});
