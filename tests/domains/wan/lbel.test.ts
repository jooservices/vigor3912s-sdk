import { describe, expect, it } from "vitest";

import { wanLbel } from "../../../src/domains/wan.js";
import { parseLbel } from "../../../src/internal/parsers/wan/lbel.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.wan.lbel", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      wanLbel.buildFrames({
        index: 1,
        enabled: true,
        protocol: "tcp",
        ipType: 0,
        objectOrGroupIndex: 1,
        portStart: 0,
        portEnd: 300,
        comment: "testforload",
      }),
    );

    expect(frame.command).toBe("wan lbel 1 1 tcp 0 1 0 300 testforload");
    expect(() =>
      wanLbel.buildFrames({
        index: 0,
        enabled: true,
        protocol: "tcp",
        ipType: 0,
        objectOrGroupIndex: 1,
        portStart: 0,
        portEnd: 300,
        comment: "x",
      }),
    ).toThrow(/index/);
    expect(() =>
      wanLbel.buildFrames({
        index: 1,
        enabled: true,
        protocol: "tcp",
        ipType: 0,
        objectOrGroupIndex: 1,
        portStart: 0,
        portEnd: 300,
        comment: "toolongcomment",
      }),
    ).toThrow(/comment/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseLbel(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanLbel, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      wanLbel.buildFrames({
        index: 1,
        enabled: true,
        protocol: "tcp",
        ipType: 0,
        objectOrGroupIndex: 1,
        portStart: 0,
        portEnd: 300,
        comment: "testforload",
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanLbel.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(parseLbel(SAMPLE_TEXT));
  });

  it("rejects an ipType outside the documented 0/1/2 set and a whitespace-containing comment", () => {
    expect(() =>
      wanLbel.buildFrames({
        index: 1,
        enabled: true,
        protocol: "tcp",
        ipType: 3 as unknown as 0,
        objectOrGroupIndex: 1,
        portStart: 0,
        portEnd: 300,
        comment: "testforload",
      }),
    ).toThrow(/ipType/);

    expect(() =>
      wanLbel.buildFrames({
        index: 1,
        enabled: true,
        protocol: "tcp",
        ipType: 0,
        objectOrGroupIndex: 1,
        portStart: 0,
        portEnd: 300,
        comment: "has space",
      }),
    ).toThrow(/comment/);
  });

  it("builds the disabled variant", () => {
    const frame = firstFrame(
      wanLbel.buildFrames({
        index: 1,
        enabled: false,
        protocol: "tcp",
        ipType: 0,
        objectOrGroupIndex: 1,
        portStart: 0,
        portEnd: 300,
        comment: "testforload",
      }),
    );

    expect(frame.command).toBe("wan lbel 1 0 tcp 0 1 0 300 testforload");
  });
});
