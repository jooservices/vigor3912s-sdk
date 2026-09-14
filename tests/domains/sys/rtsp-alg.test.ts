import { describe, expect, it } from "vitest";

import { sysRtspAlg } from "../../../src/domains/sys.js";
import { parseRtspAlg } from "../../../src/internal/parsers/sys/rtsp-alg.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.sys.rtspalg", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(sysRtspAlg.buildFrames({ port: 333 }));

    expect(frame.command).toBe("sys rtsp_alg -p 333");
    expect(() => sysRtspAlg.buildFrames({})).toThrow(/At least one/);
  });

  it("builds the frame with enabled, udp/tcp path options, and the show-portmap flag", () => {
    const frame = firstFrame(
      sysRtspAlg.buildFrames({
        enabled: true,
        udpPathEnabled: true,
        tcpPathEnabled: true,
        showPortmap: true,
      }),
    );

    expect(frame.command).toBe("sys rtsp_alg -e 1 -u 1 -t 1 -v");
  });

  it("builds the frame with enabled and both path options disabled", () => {
    const frame = firstFrame(
      sysRtspAlg.buildFrames({ enabled: false, udpPathEnabled: false, tcpPathEnabled: false }),
    );

    expect(frame.command).toBe("sys rtsp_alg -e 0 -u 0 -t 0");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseRtspAlg(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysRtspAlg.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(sysRtspAlg, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(sysRtspAlg.buildFrames({ port: 333 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
