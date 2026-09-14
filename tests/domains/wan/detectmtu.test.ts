import { describe, expect, it } from "vitest";

import { wanDetectMtu } from "../../../src/domains/wan.js";
import { parseDetectMtu } from "../../../src/internal/parsers/wan/detectmtu.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.detectmtu -- wan detect_mtu -i -s -d -w -c", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      wanDetectMtu.buildFrames({
        host: "8.8.8.8",
        mtuSize: 1500,
        decreaseSize: 30,
        wanInterface: 1,
        count: 10,
      }),
    );

    expect(frame.command).toBe("wan detect_mtu -i 8.8.8.8 -s 1500 -d 30 -w 1 -c 10");

    expect(() =>
      wanDetectMtu.buildFrames({
        host: "",
        mtuSize: 1500,
        decreaseSize: 30,
        wanInterface: 1,
        count: 10,
      }),
    ).toThrow(/host/);
    expect(() =>
      wanDetectMtu.buildFrames({
        host: "8.8.8.8",
        mtuSize: 999,
        decreaseSize: 30,
        wanInterface: 1,
        count: 10,
      }),
    ).toThrow(/mtuSize/);
    expect(() =>
      wanDetectMtu.buildFrames({
        host: "8.8.8.8",
        mtuSize: 1500,
        decreaseSize: 101,
        wanInterface: 1,
        count: 10,
      }),
    ).toThrow(/decreaseSize/);
    expect(() =>
      wanDetectMtu.buildFrames({
        host: "8.8.8.8",
        mtuSize: 1500,
        decreaseSize: 30,
        wanInterface: 1,
        count: 11,
      }),
    ).toThrow(/count/);
  });

  it("parses the documented progress text (synthetic sample)", () => {
    expect(parseDetectMtu(" mtu size:1470!!!\n")).toEqual({ raw: "mtu size:1470!!!" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(wanDetectMtu, "read");
  });

  it("carries the 60s diagnostic-exception executionOverride ceiling on the descriptor", () => {
    expect(wanDetectMtu.executionOverride).toEqual({ commandTimeoutMs: 60_000 });
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      wanDetectMtu.buildFrames({
        host: "8.8.8.8",
        mtuSize: 1500,
        decreaseSize: 30,
        wanInterface: 1,
        count: 10,
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "mtu size:1470!!!");

    expect(stdout).toBe("mtu size:1470!!!");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanDetectMtu.parse([{ stdout: " mtu size:1470!!!\n", stderr: "" }])).toEqual(
      parseDetectMtu(" mtu size:1470!!!\n"),
    );
  });
});
