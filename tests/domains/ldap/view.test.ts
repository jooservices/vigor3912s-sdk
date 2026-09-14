import { describe, expect, it } from "vitest";

import { ldapView } from "../../../src/domains/ldap.js";
import { parseLdapView } from "../../../src/internal/parsers/ldap/view.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_VIEW_TEXT = [
  "LDAP Enable:Disabled.",
  "LDAP Bind Type:Simple",
  "LDAP with SSL:Disabled",
  "LDAP Regular DN:",
  "LDAP Regular Password:",
  "LDAP Server IP:",
  "LDAP Server Port:389",
  "",
].join("\n");

describe("cli.ldap.view -- ldap view (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = ldapView.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("ldap view");
  });

  it("parses the documented status block (synthetic sample)", () => {
    expect(parseLdapView(SAMPLE_VIEW_TEXT)).toEqual({
      enabled: false,
      bindType: "Simple",
      sslEnabled: false,
      regularDn: "",
      regularPassword: "",
      serverIp: "",
      serverPort: 389,
    });
  });

  it("falls back to empty/null fields for text that doesn't match the documented shape", () => {
    expect(parseLdapView("not a status block")).toEqual({
      enabled: false,
      bindType: "",
      sslEnabled: false,
      regularDn: "",
      regularPassword: "",
      serverIp: "",
      serverPort: null,
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ldapView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ldapView.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_VIEW_TEXT);
    const report = ldapView.parse([{ stdout, stderr: "" }]);

    expect(report.serverPort).toBe(389);

    await expectClosedTransportFailure(command);
  });
});
