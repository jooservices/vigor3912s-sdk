import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysNameInput } from "../../../src/domains/sys.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.name";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysNameInput, SysAck>;

describe("sys name <wan1/wan2> <name|clear>", () => {
  it("builds the documented set/clear frames", () => {
    expect(frameCommand(operation.buildFrames({ wan: "wan1", value: "drayrouter" })[0])).toBe(
      "sys name wan1 drayrouter",
    );
    expect(frameCommand(operation.buildFrames({ wan: "wan2", value: "clear" })[0])).toBe(
      "sys name wan2 clear",
    );
  });

  it("rejects an invalid wan selector, an over-length name, and an injection attempt", () => {
    expect(() => operation.buildFrames({ wan: "bogus" as "wan1", value: "x" })).toThrow(
      /must be "wan1" or "wan2"/,
    );
    expect(() => operation.buildFrames({ wan: "wan1", value: "x".repeat(21) })).toThrow(
      /at most 20 characters/,
    );
    expect(() => operation.buildFrames({ wan: "wan1", value: "a`whoami`" })).toThrow(
      /disallowed sequence/,
    );
  });

  it("parses the documented short acknowledgement as an ack (no structured table is documented)", () => {
    const parsed = operation.parse(exchanges("% Now: wan1 == drayrouter, wan2 =="));

    expect(parsed).toEqual({ raw: "% Now: wan1 == drayrouter, wan2 ==" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ wan: "wan1", value: "drayrouter" })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
