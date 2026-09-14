import { describe, expect, it } from "vitest";

import { linuxServiceTelnetEnable } from "../../../src/domains/linux.js";
import { parseServiceTelnetEnable } from "../../../src/internal/parsers/linux/service-telnet-enable.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.linux.service.telnet.enable", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(linuxServiceTelnetEnable.buildFrames(undefined));

    expect(frame.command).toBe("linux service telnet enable");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseServiceTelnetEnable(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(linuxServiceTelnetEnable, "write");
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(linuxServiceTelnetEnable.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseServiceTelnetEnable(SAMPLE_TEXT),
    );
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(linuxServiceTelnetEnable.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
