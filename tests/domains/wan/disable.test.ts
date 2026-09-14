import { describe, expect, it } from "vitest";

import { wanDisable } from "../../../src/domains/wan.js";
import { parseDisable } from "../../../src/internal/parsers/wan/disable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.disable -- wan disable WAN<n>", () => {
  it("builds the documented frame with a required WAN index and rejects invalid input", () => {
    const frame = firstFrame(wanDisable.buildFrames({ wanInterface: 1 }));

    expect(frame.command).toBe("wan disable WAN1");

    expect(() => wanDisable.buildFrames({ wanInterface: 0 })).toThrow(/wanInterface/);
    expect(() => wanDisable.buildFrames({ wanInterface: 13 })).toThrow(/wanInterface/);
    expect(() => wanDisable.buildFrames({ wanInterface: 1.5 })).toThrow(/integer/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDisable("%WAN disabled.\n")).toEqual({ raw: "%WAN disabled." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanDisable, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanDisable.buildFrames({ wanInterface: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "%WAN disabled.");

    expect(stdout).toBe("%WAN disabled.");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanDisable.parse([{ stdout: "%WAN disabled.\n", stderr: "" }])).toEqual(
      parseDisable("%WAN disabled.\n"),
    );
  });
});
