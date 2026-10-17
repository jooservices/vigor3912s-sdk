import { describe, expect, it } from "vitest";

import { Vigor3912SClient } from "../../../src/client.js";
import { ipDnsForward } from "../../../src/domains/ip.js";
import { parseDnsForward } from "../../../src/internal/parsers/ip/dnsforward.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { exchange, FakeTransport } from "../../support/fake-transport.js";

const SAMPLE = [
  "% Idx: 1",
  "% State: Disable",
  "% Profile: test",
  "% Domain Name: ftp.drayTek.com",
  "% DNS Server IP: 172.16.1.1",
  "",
].join("\n");

describe("cli.ip.dnsforward -- ip dnsforward (read)", () => {
  const input = { profileIndex: 1 };

  it("builds the documented read-only profile-list frame", () => {
    expect(firstFrame(ipDnsForward.buildFrames(input)).command).toBe("ip dnsforward -i 1 -l");
    expect(() => ipDnsForward.buildFrames({ profileIndex: 0 })).toThrow(/profileIndex/);
  });

  it("parses the documented list text (synthetic sample)", () => {
    expect(parseDnsForward(SAMPLE)).toEqual({ raw: SAMPLE.trim() });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipDnsForward, "read");
  });

  it("invokes and parses the valid frame through a fake transport", async () => {
    const transport = new FakeTransport({ responses: [exchange(SAMPLE)] });
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.invoke(ipDnsForward, input)).resolves.toEqual({ raw: SAMPLE.trim() });
    expect(transport.calls.map((call) => call.command)).toEqual(["ip dnsforward -i 1 -l"]);
  });

  it("surfaces a fake router insufficient-arguments rejection without parsing it", async () => {
    const transport = new FakeTransport({
      responses: [exchange("% Insufficient arguments !!!")],
    });
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.invoke(ipDnsForward, input)).rejects.toMatchObject({
      code: "command_rejected",
    });
    expect(transport.calls.map((call) => call.command)).toEqual(["ip dnsforward -i 1 -l"]);
  });
});
