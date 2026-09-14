import { describe, expect, it } from "vitest";

import { wanEnable } from "../../../src/domains/wan.js";
import { parseEnable } from "../../../src/internal/parsers/wan/enable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.enable -- wan enable WAN<n>", () => {
  it("builds the documented frame with a required WAN index and rejects invalid input", () => {
    const frame = firstFrame(wanEnable.buildFrames({ wanInterface: 1 }));

    expect(frame.command).toBe("wan enable WAN1");

    expect(() => wanEnable.buildFrames({ wanInterface: 0 })).toThrow(/wanInterface/);
    expect(() => wanEnable.buildFrames({ wanInterface: 13 })).toThrow(/wanInterface/);
    expect(() => wanEnable.buildFrames({ wanInterface: 1.5 })).toThrow(/integer/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseEnable("%WAN1 enabled.\n")).toEqual({ raw: "%WAN1 enabled." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanEnable, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanEnable.buildFrames({ wanInterface: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "%WAN1 enabled.");

    expect(stdout).toBe("%WAN1 enabled.");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanEnable.parse([{ stdout: "%WAN1 enabled.\n", stderr: "" }])).toEqual(
      parseEnable("%WAN1 enabled.\n"),
    );
  });
});
