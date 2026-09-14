import { describe, expect, it } from "vitest";

import { msubnetPppip } from "../../../src/domains/msubnet.js";
import { parsePppip } from "../../../src/internal/parsers/msubnet/pppip.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.pppip -- msubnet pppip", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetPppip.buildFrames({ lanIndex: 2, startIp: "192.168.2.250" }));

    expect(frame.command).toBe("msubnet pppip 2 192.168.2.250");

    expect(() => msubnetPppip.buildFrames({ lanIndex: 2, startIp: "not-an-ip" })).toThrow(
      /startIp/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parsePppip("% Set PPP(IPCP) Start IP done !!!\n")).toEqual({
      raw: "% Set PPP(IPCP) Start IP done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetPppip, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetPppip.buildFrames({ lanIndex: 2, startIp: "192.168.2.250" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set PPP(IPCP) Start IP done !!!\n",
    );

    expect(stdout).toBe("% Set PPP(IPCP) Start IP done !!!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set PPP(IPCP) Start IP done !!!\n";

    expect(msubnetPppip.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parsePppip(sampleText),
    );
  });
});
