import { describe, expect, it } from "vitest";

import { sysSipAlg } from "../../../src/domains/sys.js";
import { parseSipAlg } from "../../../src/internal/parsers/sys/sip-alg.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.sys.sipalg", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(sysSipAlg.buildFrames({ enabled: true }));

    expect(frame.command).toBe("sys sip_alg -e 1");
    expect(() => sysSipAlg.buildFrames({})).toThrow(/At least one/);
  });

  it("builds the frame with a port and both udp/tcp path options when disabled", () => {
    const frame = firstFrame(
      sysSipAlg.buildFrames({
        enabled: false,
        port: 5060,
        udpPathEnabled: false,
        tcpPathEnabled: false,
      }),
    );

    expect(frame.command).toBe("sys sip_alg -e 0 -p 5060 -u 0 -t 0");
  });

  it("builds the frame with both udp/tcp path options enabled", () => {
    const frame = firstFrame(sysSipAlg.buildFrames({ udpPathEnabled: true, tcpPathEnabled: true }));

    expect(frame.command).toBe("sys sip_alg -u 1 -t 1");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSipAlg(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysSipAlg.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(sysSipAlg, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysSipAlg.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
