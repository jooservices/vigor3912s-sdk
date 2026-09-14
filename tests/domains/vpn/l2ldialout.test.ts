import { describe, expect, it } from "vitest";

import { vpnL2lDialout } from "../../../src/domains/vpn.js";
import { parseL2lDialout } from "../../../src/internal/parsers/vpn/l2ldialout.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.l2ldialout -- vpn l2lDialout <index>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnL2lDialout.buildFrames({ index: 3 }));

    expect(frame.command).toBe("vpn l2lDialout 3");

    expect(() => vpnL2lDialout.buildFrames({ index: 0 })).toThrow(/index/);
    expect(() => vpnL2lDialout.buildFrames({ index: 501 })).toThrow(/index/);
    expect(() => vpnL2lDialout.buildFrames({ index: 1.5 })).toThrow(/index/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseL2lDialout("% Dial out OK\n")).toEqual({ raw: "% Dial out OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnL2lDialout, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnL2lDialout.buildFrames({ index: 3 }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Dial out OK\n");

    expect(vpnL2lDialout.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Dial out OK" });

    await expectClosedTransportFailure(frame.command);
  });
});
