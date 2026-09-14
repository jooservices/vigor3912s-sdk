import { describe, expect, it } from "vitest";

import { ddnsTime } from "../../../src/domains/ddns.js";
import { parseTime } from "../../../src/internal/parsers/ddns/time.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "%Now: 1000\n";

describe("cli.ddns.time", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(ddnsTime.buildFrames({ minutes: 1000 }));

    expect(frame.command).toBe("ddns time 1000");
    expect(() => ddnsTime.buildFrames({ minutes: 0 })).toThrow(/minutes/);
    expect(() => ddnsTime.buildFrames({ minutes: 14401 })).toThrow(/minutes/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseTime(SAMPLE_TEXT)).toEqual({
      raw: "%Now: 1000",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ddnsTime, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ddnsTime.buildFrames({ minutes: 1000 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseTime", () => {
    expect(ddnsTime.parse([exchange(SAMPLE_TEXT)])).toEqual(parseTime(SAMPLE_TEXT));
  });
});
