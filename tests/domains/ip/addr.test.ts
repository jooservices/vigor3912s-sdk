import { describe, expect, it } from "vitest";

import { ipAddr } from "../../../src/domains/ip.js";
import { parseAddr } from "../../../src/internal/parsers/ip/addr.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.addr -- ip addr", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(ipAddr.buildFrames({ ipv4Address: "192.168.50.1" }));

    expect(frame.command).toBe("ip addr 192.168.50.1");

    expect(() => ipAddr.buildFrames({ ipv4Address: "not-an-ip" })).toThrow(/ipv4Address/);
    expect(() => ipAddr.buildFrames({ ipv4Address: "300.1.1.1" })).toThrow(/ipv4Address/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseAddr("% Set IP address OK !!!\n")).toEqual({ raw: "% Set IP address OK !!!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipAddr, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipAddr.buildFrames({ ipv4Address: "192.168.50.1" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Set IP address OK !!!\n");

    expect(stdout).toBe("% Set IP address OK !!!\n");

    expect(ipAddr.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    expect(ipAddr.parse([])).toEqual({ raw: "" });
    await expectClosedTransportFailure(command);
  });
});
