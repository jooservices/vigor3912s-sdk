import { describe, expect, it } from "vitest";

import { ddnsShow } from "../../../src/domains/ddns.js";
import { parseShow } from "../../../src/internal/parsers/ddns/show.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_SHOW_TEXT = [
  "--------------------------------------------------",
  " Index: 1",
  " [ ] Enable Dynamic DNS Account",
  " WAN Interface: WAN1 First",
  " Service Provider: dyn.com (www.dyn.com)",
  " Service Type: Dynamic",
  " Domain Name: [].[]",
  " Login Name:",
  " [ ] Wildcards",
  " [ ] Backup MX",
  " Mail Extender:",
  " Determine Real WAN IP: WAN IP",
  "",
].join("\n");

describe("cli.ddns.show -- ddns show -i <value> (read)", () => {
  it("builds the documented frame with a required account index and rejects invalid input", () => {
    const frame = firstFrame(ddnsShow.buildFrames({ accountIndex: 1 }));

    expect(frame.command).toBe("ddns show -i 1");

    expect(() => ddnsShow.buildFrames({ accountIndex: 0 })).toThrow(/accountIndex/);
    expect(() => ddnsShow.buildFrames({ accountIndex: 7 })).toThrow(/accountIndex/);
    expect(() => ddnsShow.buildFrames({ accountIndex: 1.5 })).toThrow(/integer/);
  });

  it("parses the documented account block (synthetic sample)", () => {
    expect(parseShow(SAMPLE_SHOW_TEXT)).toEqual({
      index: 1,
      enabled: false,
      wanInterface: "WAN1 First",
      serviceProvider: "dyn.com (www.dyn.com)",
      serviceType: "Dynamic",
      domainName: "[].[]",
      loginName: null,
      wildcardsEnabled: false,
      backupMxEnabled: false,
      mailExtender: null,
      determineRealWanIp: "WAN IP",
    });
  });

  it("returns an all-null result for text that doesn't match the documented shape", () => {
    expect(parseShow("not a ddns account block")).toEqual({
      index: null,
      enabled: null,
      wanInterface: null,
      serviceProvider: null,
      serviceType: null,
      domainName: null,
      loginName: null,
      wildcardsEnabled: null,
      backupMxEnabled: null,
      mailExtender: null,
      determineRealWanIp: null,
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ddnsShow, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ddnsShow.buildFrames({ accountIndex: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_SHOW_TEXT);

    expect(stdout).toBe(SAMPLE_SHOW_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseShow", () => {
    expect(ddnsShow.parse([exchange(SAMPLE_SHOW_TEXT)])).toEqual(parseShow(SAMPLE_SHOW_TEXT));
  });
});
