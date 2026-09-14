import { describe, expect, it } from "vitest";

import { ipDnsForward } from "../../../src/domains/ip.js";
import { parseDnsForward } from "../../../src/internal/parsers/ip/dnsforward.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

const SAMPLE = [
  "% Idx: 1",
  "% State: Disable",
  "% Profile: test",
  "% Domain Name: ftp.drayTek.com",
  "% DNS Server IP: 172.16.1.1",
  "",
].join("\n");

describe("cli.ip.dnsforward -- ip dnsforward (read)", () => {
  it("builds the documented bare/query frame", () => {
    expect(firstFrame(ipDnsForward.buildFrames()).command).toBe("ip dnsforward");
  });

  it("parses the documented list text (synthetic sample)", () => {
    expect(parseDnsForward(SAMPLE)).toEqual({ raw: SAMPLE.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipDnsForward, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipDnsForward.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE);

    expect(stdout).toBe(SAMPLE);

    expect(ipDnsForward.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
