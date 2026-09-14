import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysSyslogInput } from "../../../src/domains/sys.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.syslog";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysSyslogInput, SysAck>;

describe("sys syslog -a <0/1> [-<flag> <param> | ...]", () => {
  it("builds the documented flag-string frame", () => {
    const [frame] = operation.buildFrames({
      args: ["-a", "1", "-s", "1", "-i", "192.168.1.25", "-d", "514"],
    });

    expect(frameCommand(frame)).toBe("sys syslog -a 1 -s 1 -i 192.168.1.25 -d 514");
  });

  it("rejects a missing/invalid leading -a <0/1> pair", () => {
    expect(() => operation.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => operation.buildFrames({ args: ["-s", "1"] })).toThrow(
      /requires "-a <0\/1>" as its first two arguments/,
    );
    expect(() => operation.buildFrames({ args: ["-a", "2"] })).toThrow(
      /-a value must be "0" or "1"/,
    );
  });

  it("rejects a lone -a flag with no value argument", () => {
    expect(() => operation.buildFrames({ args: ["-a"] })).toThrow(/-a value must be "0" or "1"/);
  });

  it("rejects an injection attempt embedded in an argument token", () => {
    expect(() => operation.buildFrames({ args: ["-a", "1", "-i", "1.2.3.4;sys reboot"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("parses the documented bare-prompt output as an ack (no structured output is documented)", () => {
    const parsed = operation.parse(exchanges(""));

    expect(parsed).toEqual({ raw: "" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ args: ["-a", "1"] })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
