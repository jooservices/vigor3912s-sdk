import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysMailalertInput } from "../../../src/domains/sys.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.mailalert";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysMailalertInput, SysAck>;

describe("sys mailalert [-<flag> <param>]", () => {
  it("builds the documented bare and flagged frames (the flag string is entirely optional)", () => {
    expect(frameCommand(operation.buildFrames({ args: [] })[0])).toBe("sys mailalert");
    expect(frameCommand(operation.buildFrames({ args: ["-e", "1"] })[0])).toBe(
      "sys mailalert -e 1",
    );
  });

  it("rejects a first argument that is not a single-letter flag", () => {
    expect(() => operation.buildFrames({ args: ["enable", "1"] })).toThrow(
      /first argument must be a single-letter flag/,
    );
  });

  it("rejects an injection attempt embedded in an argument token", () => {
    expect(() => operation.buildFrames({ args: ["-a", "mail@example.com;sys reboot"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("parses the documented short acknowledgement as an ack (no structured output is documented)", () => {
    const parsed = operation.parse(exchanges(""));

    expect(parsed).toEqual({ raw: "" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ args: [] })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
