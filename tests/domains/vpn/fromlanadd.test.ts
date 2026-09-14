import { describe, expect, it } from "vitest";

import { vpnFromlanAdd } from "../../../src/domains/vpn.js";
import { parseFromlanAdd } from "../../../src/internal/parsers/vpn/fromlanadd.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.fromlan.add -- vpn fromlan add <lanx>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnFromlanAdd.buildFrames({ lan: "lan2" }));

    expect(frame.command).toBe("vpn fromlan add lan2");

    expect(() => vpnFromlanAdd.buildFrames({ lan: "lan1" })).toThrow(/lan/);
    expect(() => vpnFromlanAdd.buildFrames({ lan: "lan101" })).toThrow(/lan/);
    expect(() => vpnFromlanAdd.buildFrames({ lan: "2" })).toThrow(/lan/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseFromlanAdd("% fromlan add OK\n")).toEqual({ raw: "% fromlan add OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnFromlanAdd, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnFromlanAdd.buildFrames({ lan: "lan2" }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% fromlan add OK\n");

    expect(vpnFromlanAdd.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% fromlan add OK" });

    await expectClosedTransportFailure(frame.command);
  });
});
