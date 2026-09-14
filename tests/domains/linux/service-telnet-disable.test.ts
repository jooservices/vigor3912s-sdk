import { describe, expect, it } from "vitest";

import { linuxServiceTelnetDisable } from "../../../src/domains/linux.js";
import { parseServiceTelnetDisable } from "../../../src/internal/parsers/linux/service-telnet-disable.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.linux.service.telnet.disable", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(linuxServiceTelnetDisable.buildFrames(undefined));

    expect(frame.command).toBe("linux service telnet disable");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseServiceTelnetDisable(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(linuxServiceTelnetDisable, "write");
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(linuxServiceTelnetDisable.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseServiceTelnetDisable(SAMPLE_TEXT),
    );
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(linuxServiceTelnetDisable.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
