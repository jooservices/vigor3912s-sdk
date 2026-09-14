import { describe, expect, it } from "vitest";

import { ipPubaddr } from "../../../src/domains/ip.js";
import { parsePubaddr } from "../../../src/internal/parsers/ip/pubaddr.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.pubaddr -- ip pubaddr", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(ipPubaddr.buildFrames({ ipv4Address: "192.168.0.1" }));

    expect(frame.command).toBe("ip pubaddr 192.168.0.1");

    expect(() => ipPubaddr.buildFrames({ ipv4Address: "not-an-ip" })).toThrow(/ipv4Address/);
    expect(() => ipPubaddr.buildFrames({ ipv4Address: "999.1.1.1" })).toThrow(/ipv4Address/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parsePubaddr("% Set public subnet IP address done !!!\n")).toEqual({
      raw: "% Set public subnet IP address done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipPubaddr, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipPubaddr.buildFrames({ ipv4Address: "192.168.0.1" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Now: 192.168.0.1\n");

    expect(stdout).toBe("% Now: 192.168.0.1\n");

    expect(ipPubaddr.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
