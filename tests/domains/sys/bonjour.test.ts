import { describe, expect, it } from "vitest";

import { sysBonjour } from "../../../src/domains/sys.js";
import { parseBonjour } from "../../../src/internal/parsers/sys/bonjour.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.sys.bonjour", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(sysBonjour.buildFrames({ sshEnabled: true }));

    expect(frame.command).toBe("sys bonjour -s 1");
    expect(() => sysBonjour.buildFrames({})).toThrow(/At least one/);
  });

  it("builds the frame with every documented option enabled", () => {
    const frame = firstFrame(
      sysBonjour.buildFrames({
        serviceEnabled: true,
        httpEnabled: true,
        telnetEnabled: true,
        ftpEnabled: true,
        sshEnabled: true,
        printerEnabled: true,
        ipv6Enabled: true,
      }),
    );

    expect(frame.command).toBe("sys bonjour -e 1 -h 1 -t 1 -f 1 -s 1 -p 1 -6 1");
  });

  it("builds the frame with every documented option disabled", () => {
    const frame = firstFrame(
      sysBonjour.buildFrames({
        serviceEnabled: false,
        httpEnabled: false,
        telnetEnabled: false,
        ftpEnabled: false,
        sshEnabled: false,
        printerEnabled: false,
        ipv6Enabled: false,
      }),
    );

    expect(frame.command).toBe("sys bonjour -e 0 -h 0 -t 0 -f 0 -s 0 -p 0 -6 0");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseBonjour(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysBonjour.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(sysBonjour, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysBonjour.buildFrames({ sshEnabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
