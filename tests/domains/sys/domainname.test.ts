import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysDomainnameInput } from "../../../src/domains/sys.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.domainname";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysDomainnameInput, SysAck>;

describe("sys domainname <wan1/wan2> <suffix|clear>", () => {
  it("builds the documented set/clear frames", () => {
    expect(frameCommand(operation.buildFrames({ wan: "wan1", value: "clever" })[0])).toBe(
      "sys domainname wan1 clever",
    );
    expect(frameCommand(operation.buildFrames({ wan: "wan2", value: "clear" })[0])).toBe(
      "sys domainname wan2 clear",
    );
  });

  it("rejects an invalid wan selector, an over-length suffix, and an injection attempt", () => {
    expect(() => operation.buildFrames({ wan: "wan3" as "wan1", value: "x" })).toThrow(
      /must be "wan1" or "wan2"/,
    );
    expect(() => operation.buildFrames({ wan: "wan1", value: "x".repeat(40) })).toThrow(
      /at most 39 characters/,
    );
    expect(() => operation.buildFrames({ wan: "wan1", value: "a;rm-rf" })).toThrow(
      /disallowed sequence/,
    );
  });

  it("parses the documented short acknowledgement as an ack (no structured table is documented)", () => {
    const parsed = operation.parse(exchanges("% Now: wan1 == clever, wan2 ==intelligent"));

    expect(parsed).toEqual({ raw: "% Now: wan1 == clever, wan2 ==intelligent" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ wan: "wan1", value: "clever" })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
