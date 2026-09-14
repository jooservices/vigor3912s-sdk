import { describe, expect, it } from "vitest";

import { wanLb } from "../../../src/domains/wan.js";
import { parseLb } from "../../../src/internal/parsers/wan/lb.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.lb -- wan lb <wan#> <on/off>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(wanLb.buildFrames({ wanInterface: "wan1", state: "on" }));

    expect(frame.command).toBe("wan lb wan1 on");

    expect(() => wanLb.buildFrames({ wanInterface: "wan0", state: "on" })).toThrow(/wanInterface/);
    expect(() =>
      wanLb.buildFrames({ wanInterface: "wan1", state: "maybe" as unknown as "on" }),
    ).toThrow(/state/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseLb(" Set OK\n")).toEqual({ raw: "Set OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanLb, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanLb.buildFrames({ wanInterface: "wan1", state: "on" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Set OK");

    expect(stdout).toBe("Set OK");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanLb.parse([{ stdout: " Set OK\n", stderr: "" }])).toEqual(parseLb(" Set OK\n"));
  });
});
