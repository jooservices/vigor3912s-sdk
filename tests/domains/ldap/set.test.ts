import { describe, expect, it } from "vitest";

import { ldapSet } from "../../../src/domains/ldap.js";
import { parseSet } from "../../../src/internal/parsers/ldap/set.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ldap.set -- ldap set <Options><Value>", () => {
  it("builds each documented option's frame and rejects invalid input", () => {
    expect(firstFrame(ldapSet.buildFrames({ option: "enable", enabled: true })).command).toBe(
      "ldap set enable 1",
    );
    expect(firstFrame(ldapSet.buildFrames({ option: "enable", enabled: false })).command).toBe(
      "ldap set enable 0",
    );
    expect(firstFrame(ldapSet.buildFrames({ option: "type", bindType: 2 })).command).toBe(
      "ldap set type 2",
    );
    expect(firstFrame(ldapSet.buildFrames({ option: "ssl", enabled: true })).command).toBe(
      "ldap set ssl 1",
    );
    expect(
      firstFrame(ldapSet.buildFrames({ option: "ip", ipAddress: "192.168.100.155" })).command,
    ).toBe("ldap set IP 192.168.100.155");
    expect(firstFrame(ldapSet.buildFrames({ option: "port", port: 389 })).command).toBe(
      "ldap set port 389",
    );
    expect(
      firstFrame(ldapSet.buildFrames({ option: "dn", value: "dc=example,dc=com" })).command,
    ).toBe("ldap set dn dc=example,dc=com");
    expect(firstFrame(ldapSet.buildFrames({ option: "password", value: "123456" })).command).toBe(
      "ldap set PWD 123456",
    );

    expect(() => ldapSet.buildFrames({ option: "type", bindType: 3 as 0 | 1 | 2 })).toThrow(
      /bindType/,
    );
    expect(() => ldapSet.buildFrames({ option: "ip", ipAddress: "not-an-ip" })).toThrow(
      /ipAddress/,
    );
    expect(() => ldapSet.buildFrames({ option: "port", port: 0 })).toThrow(/port/);
    expect(() => ldapSet.buildFrames({ option: "port", port: 70000 })).toThrow(/port/);
    expect(() => ldapSet.buildFrames({ option: "dn", value: "  " })).toThrow(/value/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSet("LDAP Server Port has been setting.\n")).toEqual({
      raw: "LDAP Server Port has been setting.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ldapSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ldapSet.buildFrames({ option: "port", port: 389 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "LDAP Server Port has been setting.\n",
    );

    expect(ldapSet.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "LDAP Server Port has been setting.",
    });

    await expectClosedTransportFailure(command);
  });
});
