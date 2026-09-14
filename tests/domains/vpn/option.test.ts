import { describe, expect, it } from "vitest";

import { vpnOption } from "../../../src/domains/vpn.js";
import { parseOption } from "../../../src/internal/parsers/vpn/option.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.option -- vpn option <index> <param>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnOption.buildFrames({ index: 1, param: "idle=250" }));

    expect(frame.command).toBe("vpn option 1 idle=250");

    expect(() => vpnOption.buildFrames({ index: 0, param: "x" })).toThrow(/index/);
    expect(() => vpnOption.buildFrames({ index: 1, param: "" })).toThrow(/param/);
    expect(() => vpnOption.buildFrames({ index: 1, param: "idle=250;rm" })).toThrow(/param/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOption("% Change Log..\n\n% Idle Timeout = 250\n")).toEqual({
      raw: "% Change Log..\n\n% Idle Timeout = 250",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnOption, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnOption.buildFrames({ index: 1, param: "idle=250" }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% Change Log..\n\n% Idle Timeout = 250\n",
    );

    expect(vpnOption.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Change Log..\n\n% Idle Timeout = 250",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
