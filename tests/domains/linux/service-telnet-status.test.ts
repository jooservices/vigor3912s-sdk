import { describe, expect, it } from "vitest";

import { linuxServiceTelnetStatus } from "../../../src/domains/linux.js";
import { parseServiceTelnetStatus } from "../../../src/internal/parsers/linux/service-telnet-status.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "Telnet service is enabled\n";

describe("cli.linux.service.telnet.status", () => {
  it("builds the documented frame", () => {
    const frame = firstFrame(linuxServiceTelnetStatus.buildFrames(undefined));

    expect(frame.command).toBe("linux service telnet status");
  });

  it("parses status text into an enabled flag (synthetic sample)", () => {
    expect(parseServiceTelnetStatus(SAMPLE_TEXT)).toEqual({
      raw: "Telnet service is enabled",
      enabled: true,
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(linuxServiceTelnetStatus, "read");
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(linuxServiceTelnetStatus.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseServiceTelnetStatus(SAMPLE_TEXT),
    );
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(linuxServiceTelnetStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
