import { describe, expect, it } from "vitest";

import { sysAdminuser } from "../../../src/domains/sys.js";
import { parseAdminuser } from "../../../src/internal/parsers/sys/adminuser.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "OK\n";

describe("cli.sys.adminuser", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(sysAdminuser.buildFrames({ target: "Local", enabled: true }));

    expect(frame.command).toBe("sys adminuser Local 1");
    expect(() => sysAdminuser.buildFrames({ target: "Nope" as "Local", enabled: true })).toThrow(
      /target/,
    );
  });

  it("builds the documented frame when disabled", () => {
    const frame = firstFrame(sysAdminuser.buildFrames({ target: "LDAP", enabled: false }));

    expect(frame.command).toBe("sys adminuser LDAP 0");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseAdminuser(SAMPLE_TEXT)).toEqual({
      raw: "OK",
    });
  });

  it("parses through the operation.parse exchanges wrapper (synthetic sample)", () => {
    expect(sysAdminuser.parse(exchanges(SAMPLE_TEXT))).toEqual({
      raw: "OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(sysAdminuser, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      sysAdminuser.buildFrames({ target: "Local", enabled: true }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
