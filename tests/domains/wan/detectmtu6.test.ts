import { describe, expect, it } from "vitest";

import { wanDetectMtu6 } from "../../../src/domains/wan.js";
import { parseDetectMtu6 } from "../../../src/internal/parsers/wan/detectmtu6.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.detectmtu6 -- wan detect_mtu6 -i -s -w", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      wanDetectMtu6.buildFrames({ host: "2001:db8::1", mtuSize: 1500, wanInterface: 2 }),
    );

    expect(frame.command).toBe("wan detect_mtu6 -i 2001:db8::1 -s 1500 -w 2");

    expect(() => wanDetectMtu6.buildFrames({ host: "  ", mtuSize: 1500, wanInterface: 2 })).toThrow(
      /host/,
    );
    expect(() =>
      wanDetectMtu6.buildFrames({ host: "2001:db8::1", mtuSize: 1279, wanInterface: 2 }),
    ).toThrow(/mtuSize/);
    expect(() =>
      wanDetectMtu6.buildFrames({ host: "2001:db8::1", mtuSize: 1500, wanInterface: 13 }),
    ).toThrow(/wanInterface/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDetectMtu6("\n")).toEqual({ raw: "" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(wanDetectMtu6, "read");
  });

  it("carries the 60s diagnostic-exception executionOverride ceiling on the descriptor", () => {
    expect(wanDetectMtu6.executionOverride).toEqual({ commandTimeoutMs: 60_000 });
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      wanDetectMtu6.buildFrames({ host: "2001:db8::1", mtuSize: 1500, wanInterface: 2 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanDetectMtu6.parse([{ stdout: "\n", stderr: "" }])).toEqual(parseDetectMtu6("\n"));
  });
});
