import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.cfg.default";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysAck>;

describe("sys cfg default (destructive -- fake transport only, never invoked against anything real)", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys cfg default");
  });

  it("parses the documented bare-prompt output as an ack (no structured output is documented)", () => {
    const parsed = operation.parse(exchanges(""));

    expect(parsed).toEqual({ raw: "" });
  });

  it("is linked in the manifest as implemented, classification destructive, matching the TypedOperation's classification", () => {
    assertManifestLinkage(MANIFEST_ID, "destructive");
    expect(operation.classification).toBe("destructive");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames()[0]),
      "",
    );

    expect(stdout).toBe("");
    await expectClosedTransportFailure("sys cfg default");
  });
});
