import { describe, expect, it } from "vitest";

import { apmEnable } from "../../../src/domains/apm.js";
import { parseEnable } from "../../../src/internal/parsers/apm/enable.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.enable -- apm enable", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmEnable.buildFrames(undefined));

    expect(frame.command).toBe("apm enable");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseEnable("% APM enabled.\n")).toEqual({
      raw: "% APM enabled.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(apmEnable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmEnable.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% APM enabled.");

    expect(stdout).toBe("% APM enabled.");
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseEnable", () => {
    expect(apmEnable.parse([exchange("% APM enabled.\n")])).toEqual(
      parseEnable("% APM enabled.\n"),
    );
  });

  it("falls back to an empty string when no exchange was captured", () => {
    expect(apmEnable.parse([])).toEqual(parseEnable(""));
  });
});
