import { describe, expect, it } from "vitest";

import { ddnsEnable } from "../../../src/domains/ddns.js";
import { parseEnable } from "../../../src/internal/parsers/ddns/enable.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

describe("cli.ddns.enable -- ddns enable [0/1]", () => {
  it("builds the documented frame for both enabled states", () => {
    expect(firstFrame(ddnsEnable.buildFrames({ enabled: true })).command).toBe("ddns enable 1");
    expect(firstFrame(ddnsEnable.buildFrames({ enabled: false })).command).toBe("ddns enable 0");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseEnable(" Enable Dynamic DNS Setup\n")).toEqual({
      raw: "Enable Dynamic DNS Setup",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ddnsEnable, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ddnsEnable.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, " Enable Dynamic DNS Setup\n");

    expect(stdout).toBe(" Enable Dynamic DNS Setup\n");
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseEnable", () => {
    expect(ddnsEnable.parse([exchange(" Enable Dynamic DNS Setup\n")])).toEqual(
      parseEnable(" Enable Dynamic DNS Setup\n"),
    );
  });

  it("falls back to an empty string when no exchange was captured", () => {
    expect(ddnsEnable.parse([])).toEqual(parseEnable(""));
  });
});
