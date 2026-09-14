import { describe, expect, it } from "vitest";

import { wanPppMru } from "../../../src/domains/wan.js";
import { parsePppMru } from "../../../src/internal/parsers/wan/pppmru.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.pppmru -- wan ppp_mru", () => {
  it("builds the documented frame and rejects out-of-range input", () => {
    const frame = firstFrame(wanPppMru.buildFrames({ wanInterface: 1, mruSize: 1490 }));

    expect(frame.command).toBe("wan ppp_mru 1 1490");

    expect(() => wanPppMru.buildFrames({ wanInterface: 0, mruSize: 1490 })).toThrow(/wanInterface/);
    expect(() => wanPppMru.buildFrames({ wanInterface: 13, mruSize: 1490 })).toThrow(
      /wanInterface/,
    );
    expect(() => wanPppMru.buildFrames({ wanInterface: 1, mruSize: 1399 })).toThrow(/mruSize/);
    expect(() => wanPppMru.buildFrames({ wanInterface: 1, mruSize: 1601 })).toThrow(/mruSize/);
    expect(() => wanPppMru.buildFrames({ wanInterface: 1.5, mruSize: 1490 })).toThrow(/integer/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parsePppMru("% Now: 1490\n")).toEqual({ raw: "% Now: 1490" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanPppMru, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanPppMru.buildFrames({ wanInterface: 1, mruSize: 1490 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Now: 1490");

    expect(stdout).toBe("% Now: 1490");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanPppMru.parse([{ stdout: "% Now: 1490\n", stderr: "" }])).toEqual(
      parsePppMru("% Now: 1490\n"),
    );
  });
});
