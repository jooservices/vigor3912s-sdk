import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysWebhookInput } from "../../../src/domains/sys.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.webhook";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysWebhookInput, SysAck>;

describe("sys webhook <enable|send|status|url|period> [args...]", () => {
  it("builds the documented subcommand frames", () => {
    expect(frameCommand(operation.buildFrames({ args: ["status"] })[0])).toBe("sys webhook status");
    expect(frameCommand(operation.buildFrames({ args: ["period", "3"] })[0])).toBe(
      "sys webhook period 3",
    );
  });

  it("rejects an empty args array and an unrecognized subcommand", () => {
    expect(() => operation.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => operation.buildFrames({ args: ["bogus"] })).toThrow(/subcommand must be one of/);
  });

  it("rejects an injection attempt embedded in an argument token", () => {
    expect(() => operation.buildFrames({ args: ["url", "http://x|sysreboot"] })).toThrow(
      /disallowed sequence/,
    );
  });

  it("parses the documented status block as a pass-through (five subcommands, each with its own shape)", () => {
    const parsed = operation.parse(
      exchanges("webhook is off\nMonitoring Server URL:\nReport Period: 3"),
    );

    expect(parsed).toEqual({ raw: "webhook is off\nMonitoring Server URL:\nReport Period: 3" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ args: ["status"] })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "webhook is off");

    expect(stdout).toBe("webhook is off");
    await expectClosedTransportFailure(command);
  });
});
