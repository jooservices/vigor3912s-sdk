import { describe, expect, it } from "vitest";

import { apmLbcfgShow } from "../../../src/domains/apm.js";
import { parseLbcfgShow } from "../../../src/internal/parsers/apm/lbcfg-show.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.lbcfg.show -- apm lbcfg show", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmLbcfgShow.buildFrames(undefined));

    expect(frame.command).toBe("apm lbcfg show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseLbcfgShow("apm LoadBalance Config :\n1. Enable LoadBalance : 0\n")).toEqual({
      raw: "apm LoadBalance Config :\n1. Enable LoadBalance : 0",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(apmLbcfgShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmLbcfgShow.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "apm LoadBalance Config :\n1. Enable LoadBalance : 0",
    );

    expect(stdout).toBe("apm LoadBalance Config :\n1. Enable LoadBalance : 0");
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseLbcfgShow", () => {
    expect(
      apmLbcfgShow.parse([exchange("apm LoadBalance Config :\n1. Enable LoadBalance : 0")]),
    ).toEqual(parseLbcfgShow("apm LoadBalance Config :\n1. Enable LoadBalance : 0"));
  });
});
