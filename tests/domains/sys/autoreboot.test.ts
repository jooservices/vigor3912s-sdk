import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysAutorebootInput } from "../../../src/domains/sys.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.autoreboot";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysAutorebootInput, SysAck>;

describe("sys autoreboot <on/off/hours>", () => {
  it("builds the documented on/off/hours frames", () => {
    expect(frameCommand(operation.buildFrames("on")[0])).toBe("sys autoreboot on");
    expect(frameCommand(operation.buildFrames("off")[0])).toBe("sys autoreboot off");
    expect(frameCommand(operation.buildFrames({ hours: 2 })[0])).toBe("sys autoreboot 2");
  });

  it("rejects a non-positive or non-integer hours value", () => {
    expect(() => operation.buildFrames({ hours: 0 })).toThrow(/positive integer/);
    expect(() => operation.buildFrames({ hours: -1 })).toThrow(/positive integer/);
    expect(() => operation.buildFrames({ hours: 1.5 })).toThrow(/positive integer/);
  });

  it("parses the documented on/hours acknowledgement as an ack (output shape varies by argument)", () => {
    const parsed = operation.parse(exchanges(" autoreboot is ON\n autoreboot time is 2 hour(s)"));

    expect(parsed).toEqual({ raw: "autoreboot is ON\n autoreboot time is 2 hour(s)" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames("on")[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, " autoreboot is ON");

    expect(stdout).toContain("autoreboot is ON");
    await expectClosedTransportFailure(command);
  });
});
