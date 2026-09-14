import { describe, expect, it } from "vitest";

import { linuxServiceTelnetSetport } from "../../../src/domains/linux.js";
import { parseServiceTelnetSetport } from "../../../src/internal/parsers/linux/service-telnet-setport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.linux.service.telnet.setport", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(linuxServiceTelnetSetport.buildFrames({ port: 23 }));

    expect(frame.command).toBe("linux service telnet setport 23");
    expect(() => linuxServiceTelnetSetport.buildFrames({ port: 0 })).toThrow(/port/);
    expect(() => linuxServiceTelnetSetport.buildFrames({ port: 65536 })).toThrow(/port/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseServiceTelnetSetport(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(linuxServiceTelnetSetport, "write");
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(linuxServiceTelnetSetport.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseServiceTelnetSetport(SAMPLE_TEXT),
    );
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(linuxServiceTelnetSetport.buildFrames({ port: 23 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
