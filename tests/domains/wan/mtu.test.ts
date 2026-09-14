import { describe, expect, it } from "vitest";

import { wanMtu } from "../../../src/domains/wan.js";
import { parseMtu } from "../../../src/internal/parsers/wan/mtu.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.mtu.mtu2 -- wan mtu / mtu2", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(wanMtu.buildFrames({ target: "mtu2", value: 1100 }));

    expect(frame.command).toBe("wan mtu2 1100");

    expect(() => wanMtu.buildFrames({ target: "mtu3" as unknown as "mtu", value: 1100 })).toThrow(
      /target/,
    );
    expect(() => wanMtu.buildFrames({ target: "mtu", value: 999 })).toThrow(/value/);
    expect(() => wanMtu.buildFrames({ target: "mtu", value: 1501 })).toThrow(/value/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMtu("% Now: 1100\n")).toEqual({ raw: "% Now: 1100" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanMtu, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanMtu.buildFrames({ target: "mtu", value: 1100 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Now: 1100");

    expect(stdout).toBe("% Now: 1100");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanMtu.parse([{ stdout: "% Now: 1100\n", stderr: "" }])).toEqual(
      parseMtu("% Now: 1100\n"),
    );
  });
});
