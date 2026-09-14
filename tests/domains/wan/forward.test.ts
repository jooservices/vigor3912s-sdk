import { describe, expect, it } from "vitest";

import { wanForward } from "../../../src/domains/wan.js";
import { parseForward } from "../../../src/internal/parsers/wan/forward.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.forward -- wan forward <on/off>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(wanForward.buildFrames({ state: "on" }));

    expect(frame.command).toBe("wan forward on");

    expect(() => wanForward.buildFrames({ state: "maybe" as unknown as "on" })).toThrow(/state/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseForward("%WAN forwarding is enable!\n")).toEqual({
      raw: "%WAN forwarding is enable!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanForward, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanForward.buildFrames({ state: "on" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "%WAN forwarding is enable!");

    expect(stdout).toBe("%WAN forwarding is enable!");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "%WAN forwarding is enable!\n";

    expect(wanForward.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseForward(sampleText),
    );
  });
});
