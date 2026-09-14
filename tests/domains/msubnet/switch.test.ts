import { describe, expect, it } from "vitest";

import { msubnetSwitch } from "../../../src/domains/msubnet.js";
import { parseSwitch } from "../../../src/internal/parsers/msubnet/switchOp.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.switch -- msubnet switch", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetSwitch.buildFrames({ lanIndex: 99, enabled: true }));

    expect(frame.command).toBe("msubnet switch 99 On");

    expect(() => msubnetSwitch.buildFrames({ lanIndex: 1, enabled: true })).toThrow(/lanIndex/);
    expect(() => msubnetSwitch.buildFrames({ lanIndex: 101, enabled: true })).toThrow(/lanIndex/);
    expect(() => msubnetSwitch.buildFrames({ lanIndex: 2.5, enabled: true })).toThrow(/lanIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwitch("% LAN2        Subnet On!\n")).toEqual({ raw: "% LAN2        Subnet On!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetSwitch, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(msubnetSwitch.buildFrames({ lanIndex: 2, enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% LAN2        Subnet On!\n");

    expect(stdout).toBe("% LAN2        Subnet On!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% LAN2        Subnet On!\n";

    expect(msubnetSwitch.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseSwitch(sampleText),
    );
  });
});
