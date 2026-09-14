import { describe, expect, it } from "vitest";

import { ddnsSet } from "../../../src/domains/ddns.js";
import { parseSet } from "../../../src/internal/parsers/ddns/set.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "Save OK\n";

describe("cli.ddns.set", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      ddnsSet.buildFrames({
        accountIndex: 1,
        serviceProvider: 6,
        serviceType: 1,
        domainName: "hostname.dnsalias.net",
        loginName: "user1",
        password: "pwd1",
      }),
    );

    expect(frame.command).toBe("ddns set -i 1 -S 6 -T 1 -D hostname.dnsalias.net -L user1 -P pwd1");
    expect(() =>
      ddnsSet.buildFrames({
        accountIndex: 0,
        serviceProvider: 6,
        serviceType: 1,
        domainName: "h",
        loginName: "u",
        password: "p",
      }),
    ).toThrow(/accountIndex/);
  });

  it("rejects a domainName/loginName/password containing whitespace", () => {
    expect(() =>
      ddnsSet.buildFrames({
        accountIndex: 1,
        serviceProvider: 6,
        serviceType: 1,
        domainName: "host name.dnsalias.net",
        loginName: "user1",
        password: "pwd1",
      }),
    ).toThrow(/domainName/);
  });

  it("rejects a domainName longer than the documented 64-character limit", () => {
    expect(() =>
      ddnsSet.buildFrames({
        accountIndex: 1,
        serviceProvider: 6,
        serviceType: 1,
        domainName: `${"a".repeat(65)}.net`,
        loginName: "user1",
        password: "pwd1",
      }),
    ).toThrow(/domainName/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSet(SAMPLE_TEXT)).toEqual({
      raw: "Save OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ddnsSet, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      ddnsSet.buildFrames({
        accountIndex: 1,
        serviceProvider: 6,
        serviceType: 1,
        domainName: "hostname.dnsalias.net",
        loginName: "user1",
        password: "pwd1",
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseSet", () => {
    expect(ddnsSet.parse([exchange(SAMPLE_TEXT)])).toEqual(parseSet(SAMPLE_TEXT));
  });
});
