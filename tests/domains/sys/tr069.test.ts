import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysTr069Input } from "../../../src/domains/sys.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.tr069";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysTr069Input, SysAck>;

describe("sys tr069 <subcommand> [args...]", () => {
  it("builds the documented subcommand frames", () => {
    expect(frameCommand(operation.buildFrames({ args: ["log"] })[0])).toBe("sys tr069 log");
    expect(frameCommand(operation.buildFrames({ args: ["debug", "on"] })[0])).toBe(
      "sys tr069 debug on",
    );
  });

  it("rejects an empty args array and an unrecognized subcommand", () => {
    expect(() => operation.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => operation.buildFrames({ args: ["bogus"] })).toThrow(/subcommand must be one of/);
  });

  it("rejects an injection attempt embedded in an argument token", () => {
    expect(() => operation.buildFrames({ args: ["debug", "on;show session"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("parses the documented log/ack output as a pass-through (~20 subcommands, each with its own shape)", () => {
    const parsed = operation.parse(exchanges("save"));

    expect(parsed).toEqual({ raw: "save" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ args: ["log"] })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
