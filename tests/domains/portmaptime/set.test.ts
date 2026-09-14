import { describe, expect, it } from "vitest";

import { portmaptimeSet } from "../../../src/domains/portmaptime.js";
import { parseSet } from "../../../src/internal/parsers/portmaptime/set.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.portmaptime -- portmaptime -t/-u/-i/-w/-s (write)", () => {
  it("builds the documented timeout frame and rejects empty/invalid input", () => {
    const frame = firstFrame(
      portmaptimeSet.buildFrames({
        tcpTimeoutSeconds: 86400,
        udpTimeoutSeconds: 300,
        igmpTimeoutSeconds: 10,
      }),
    );

    expect(frame.command).toBe("portmaptime -t 86400 -u 300 -i 10");

    expect(() => portmaptimeSet.buildFrames({})).toThrow(/at least one/i);
    expect(() => portmaptimeSet.buildFrames({ tcpTimeoutSeconds: 0 })).toThrow(/tcpTimeoutSeconds/);
    expect(() => portmaptimeSet.buildFrames({ udpTimeoutSeconds: -1 })).toThrow(
      /udpTimeoutSeconds/,
    );
  });

  it("builds a frame combining the WWW and SYN timeout flags", () => {
    const frame = firstFrame(
      portmaptimeSet.buildFrames({
        tcpWwwTimeoutSeconds: 60,
        tcpSynTimeoutSeconds: 30,
      }),
    );

    expect(frame.command).toBe("portmaptime -w 60 -s 30");
  });

  it("rejects a non-integer timeout value", () => {
    expect(() => portmaptimeSet.buildFrames({ tcpTimeoutSeconds: 1.5 })).toThrow(
      /tcpTimeoutSeconds must be an integer/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSet("% Set portmaptime OK\n")).toEqual({ raw: "% Set portmaptime OK" });
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(portmaptimeSet.parse([{ stdout: "% Set portmaptime OK\n", stderr: "" }])).toEqual({
      raw: "% Set portmaptime OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(portmaptimeSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(portmaptimeSet.buildFrames({ tcpTimeoutSeconds: 86400 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Set portmaptime OK\n");

    expect(stdout).toBe("% Set portmaptime OK\n");
    await expectClosedTransportFailure(command);
  });
});
