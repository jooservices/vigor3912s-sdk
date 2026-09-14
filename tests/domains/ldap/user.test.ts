import { describe, expect, it } from "vitest";

import { ldapUser } from "../../../src/domains/ldap.js";
import { parseUser } from "../../../src/internal/parsers/ldap/user.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ldap.user -- ldap user <INDEX><OPTION>", () => {
  it("builds each documented option's frame and rejects invalid input", () => {
    expect(
      firstFrame(ldapUser.buildFrames({ index: 1, action: "name", value: "LD_user_test1" }))
        .command,
    ).toBe("ldap user 1 -n LD_user_test1");

    expect(
      firstFrame(
        ldapUser.buildFrames({
          index: 1,
          action: "baseDn",
          value: "ou=People,dc=example,dc=com",
        }),
      ).command,
    ).toBe("ldap user 1 -b ou=People,dc=example,dc=com");

    expect(
      firstFrame(ldapUser.buildFrames({ index: 1, action: "filter", value: "(department=HR)" }))
        .command,
    ).toBe("ldap user 1 -a (department=HR)");

    expect(
      firstFrame(
        ldapUser.buildFrames({ index: 1, action: "groupDn", value: "CN=HRGroup,OU=Groups" }),
      ).command,
    ).toBe("ldap user 1 -g CN=HRGroup,OU=Groups");

    expect(
      firstFrame(ldapUser.buildFrames({ index: 1, action: "commonName", value: "cn" })).command,
    ).toBe("ldap user 1 -c cn");

    expect(firstFrame(ldapUser.buildFrames({ index: 1, action: "view" })).command).toBe(
      "ldap user 1 -v",
    );

    expect(() => ldapUser.buildFrames({ index: 0, action: "view" })).toThrow(/index/);
    expect(() => ldapUser.buildFrames({ index: 9, action: "view" })).toThrow(/index/);
    expect(() => ldapUser.buildFrames({ index: 1.5, action: "view" })).toThrow(/integer/);
    expect(() => ldapUser.buildFrames({ index: 1, action: "name", value: "   " })).toThrow(/value/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUser("Profile Name has been updated!\n")).toEqual({
      raw: "Profile Name has been updated!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ldapUser, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      ldapUser.buildFrames({ index: 1, action: "name", value: "LD_user_test1" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Profile Name has been updated!\n",
    );

    expect(ldapUser.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Profile Name has been updated!",
    });

    await expectClosedTransportFailure(command);
  });
});
