import { describe, expect, it } from "vitest";

import { vrrpEnable } from "../../../src/domains/vrrp.js";
import { parseVrrpEnable } from "../../../src/internal/parsers/vrrp/enable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vrrp.enable -- vrrp enable <on|off>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(vrrpEnable.buildFrames({ onOff: "on" })).command).toBe("vrrp enable on");
    expect(firstFrame(vrrpEnable.buildFrames({ onOff: "off" })).command).toBe("vrrp enable off");

    expect(() => vrrpEnable.buildFrames({ onOff: "maybe" as "on" })).toThrow(/onOff/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseVrrpEnable("% Enable OK\n")).toEqual({ raw: "% Enable OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vrrpEnable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(vrrpEnable.buildFrames({ onOff: "on" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Enable OK\n");

    expect(vrrpEnable.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Enable OK" });

    await expectClosedTransportFailure(command);
  });
});
