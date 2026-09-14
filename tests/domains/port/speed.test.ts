import { describe, expect, it } from "vitest";

import { portSpeed } from "../../../src/domains/port.js";
import { parseSpeed } from "../../../src/internal/parsers/port/speed.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "%Set Port 1 Force speed 100 Full duplex OK !!!\n";

describe("cli.port -- port <lan|wan> <speed> (write)", () => {
  it("builds the documented LAN/WAN speed frames and rejects invalid input", () => {
    expect(
      firstFrame(portSpeed.buildFrames({ kind: "lan", port: "1", speed: "100F" })).command,
    ).toBe("port 1 100F");
    expect(
      firstFrame(portSpeed.buildFrames({ kind: "wan", port: "wan1", speed: "1000F" })).command,
    ).toBe("port wan1 1000F");

    expect(() => portSpeed.buildFrames({ kind: "lan", port: "13" as never, speed: "AN" })).toThrow(
      /port/,
    );
    expect(() =>
      portSpeed.buildFrames({ kind: "lan", port: "1", speed: "1000F" as never }),
    ).toThrow(/speed/);
    expect(() =>
      portSpeed.buildFrames({ kind: "wan", port: "wan5" as never, speed: "AN" }),
    ).toThrow(/port/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSpeed(SAMPLE_TEXT)).toEqual({
      raw: "%Set Port 1 Force speed 100 Full duplex OK !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(portSpeed, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      portSpeed.buildFrames({ kind: "lan", port: "1", speed: "100F" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(portSpeed.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "%Set Port 1 Force speed 100 Full duplex OK !!!",
    });

    await expectClosedTransportFailure(command);
  });
});
