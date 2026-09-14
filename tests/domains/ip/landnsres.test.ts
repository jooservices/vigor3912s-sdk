import { describe, expect, it } from "vitest";

import { ipLanDnsRes } from "../../../src/domains/ip.js";
import { parseLanDnsRes } from "../../../src/internal/parsers/ip/landnsres.js";
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
  "% Domain Name:",
  "% -------- Address Mapping Table --------",
  "% Not Set Address Mapping.",
  "",
].join("\n");

describe("cli.ip.landnsres -- ip lanDNSRes (read)", () => {
  it("builds the documented bare/query frame", () => {
    expect(firstFrame(ipLanDnsRes.buildFrames()).command).toBe("ip lanDNSRes");
  });

  it("parses the documented list text (synthetic sample)", () => {
    expect(parseLanDnsRes(SAMPLE)).toEqual({ raw: SAMPLE.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipLanDnsRes, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipLanDnsRes.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE);

    expect(stdout).toBe(SAMPLE);

    expect(ipLanDnsRes.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
