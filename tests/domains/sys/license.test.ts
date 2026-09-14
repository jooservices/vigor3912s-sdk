import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysLicenseInput } from "../../../src/domains/sys.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.license";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysLicenseInput, SysAck>;

describe("sys license <subcommand> [args...]", () => {
  it("builds the documented subcommand frames", () => {
    expect(frameCommand(operation.buildFrames({ args: ["liclog"] })[0])).toBe("sys license liclog");
    expect(frameCommand(operation.buildFrames({ args: ["licifno", "wan1"] })[0])).toBe(
      "sys license licifno wan1",
    );
  });

  it("rejects an empty args array and an unrecognized subcommand", () => {
    expect(() => operation.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => operation.buildFrames({ args: ["bogus"] })).toThrow(/subcommand must be one of/);
  });

  it("rejects an injection attempt embedded in an argument token", () => {
    expect(() => operation.buildFrames({ args: ["licifno", "wan1 && sys reboot"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("parses the documented log/ack output as a pass-through (six subcommands, each with its own shape)", () => {
    const parsed = operation.parse(exchanges('Download interface is "auto-selected" now.'));

    expect(parsed).toEqual({ raw: 'Download interface is "auto-selected" now.' });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ args: ["liclog"] })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
