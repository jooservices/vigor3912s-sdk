import { describe, expect, it } from "vitest";

import { wanDns } from "../../../src/domains/wan.js";
import { parseDns } from "../../../src/internal/parsers/wan/dns.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.dns -- wan dns", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      wanDns.buildFrames({ wanNo: 1, dnsSelect: "pri", ipv4Address: "168.95.1.1" }),
    );

    expect(frame.command).toBe("wan dns 1 pri 168.95.1.1");

    expect(() =>
      wanDns.buildFrames({ wanNo: 0, dnsSelect: "pri", ipv4Address: "168.95.1.1" }),
    ).toThrow(/wanNo/);
    expect(() =>
      wanDns.buildFrames({ wanNo: 11, dnsSelect: "pri", ipv4Address: "168.95.1.1" }),
    ).toThrow(/wanNo/);
    expect(() =>
      wanDns.buildFrames({
        wanNo: 1,
        dnsSelect: "ter" as unknown as "pri",
        ipv4Address: "168.95.1.1",
      }),
    ).toThrow(/dnsSelect/);
    expect(() =>
      wanDns.buildFrames({ wanNo: 1, dnsSelect: "pri", ipv4Address: "not-an-ip" }),
    ).toThrow(/ipv4Address/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDns("% Set WAN1 primary DNS done.\n% Now: 168.95.1.1\n")).toEqual({
      raw: "% Set WAN1 primary DNS done.\n% Now: 168.95.1.1",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanDns, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      wanDns.buildFrames({ wanNo: 1, dnsSelect: "pri", ipv4Address: "168.95.1.1" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Now: 168.95.1.1");

    expect(stdout).toBe("% Now: 168.95.1.1");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set WAN1 primary DNS done.\n% Now: 168.95.1.1\n";

    expect(wanDns.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseDns(sampleText));
  });
});
