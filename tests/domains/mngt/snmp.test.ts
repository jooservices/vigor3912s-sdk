import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtSnmpInput } from "../../../src/domains/mngt.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.snmp";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtSnmpInput, MngtAck>;

describe("mngt snmp [-<command> <parameter> | ...]", () => {
  it("builds the documented flagged frame", () => {
    const [frame] = operation.buildFrames({ args: ["-e", "1", "-g", "example"] });

    expect(frameCommand(frame)).toBe("mngt snmp -e 1 -g example");
  });

  it("rejects an empty args array and an unrecognized flag", () => {
    expect(() => operation.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => operation.buildFrames({ args: ["-z"] })).toThrow(
      /is not one of the documented flags/,
    );
  });

  it("rejects an injection attempt embedded in an argument token", () => {
    expect(() => operation.buildFrames({ args: ["-g", "example;sys reboot"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("parses the documented settings-summary acknowledgement as an ack (no structured table is documented here)", () => {
    const parsed = operation.parse(exchanges("SNMP Agent Turn on!!!"));

    expect(parsed).toEqual({ raw: "SNMP Agent Turn on!!!" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ args: ["-V"] })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
