import { describe, expect, it } from "vitest";

import { sysBoard } from "../../../src/domains/sys.js";
import { parseBoard } from "../../../src/internal/parsers/sys/board.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.sys.board", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(sysBoard.buildFrames({ target: "ledSleepMode", enabled: true }));

    expect(frame.command).toBe("sys board led sleepMode on");
    expect(() => sysBoard.buildFrames({ target: "ledSleepModeTime", minutes: 0 })).toThrow(
      /minutes/,
    );
  });

  it("builds the ledSleepMode frame when disabled", () => {
    expect(
      firstFrame(sysBoard.buildFrames({ target: "ledSleepMode", enabled: false })).command,
    ).toBe("sys board led sleepMode off");
  });

  it("builds the buttonDef, buttonWlan, and ledControl frames for both enabled states", () => {
    expect(firstFrame(sysBoard.buildFrames({ target: "buttonDef", enabled: true })).command).toBe(
      "sys board button def on",
    );
    expect(firstFrame(sysBoard.buildFrames({ target: "buttonDef", enabled: false })).command).toBe(
      "sys board button def off",
    );
    expect(firstFrame(sysBoard.buildFrames({ target: "buttonWlan", enabled: true })).command).toBe(
      "sys board button wlan on",
    );
    expect(firstFrame(sysBoard.buildFrames({ target: "buttonWlan", enabled: false })).command).toBe(
      "sys board button wlan off",
    );
    expect(firstFrame(sysBoard.buildFrames({ target: "ledControl", enabled: true })).command).toBe(
      "sys board led control on",
    );
    expect(firstFrame(sysBoard.buildFrames({ target: "ledControl", enabled: false })).command).toBe(
      "sys board led control off",
    );
  });

  it("builds the usb frame for both ports and enabled states, and rejects an invalid port", () => {
    expect(
      firstFrame(sysBoard.buildFrames({ target: "usb", port: "p1", enabled: true })).command,
    ).toBe("sys board usb p1 on");
    expect(
      firstFrame(sysBoard.buildFrames({ target: "usb", port: "p2", enabled: false })).command,
    ).toBe("sys board usb p2 off");
    expect(() =>
      sysBoard.buildFrames({ target: "usb", port: "p3" as "p1", enabled: true }),
    ).toThrow(/port/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseBoard(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysBoard.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(sysBoard, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      sysBoard.buildFrames({ target: "ledSleepMode", enabled: true }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
