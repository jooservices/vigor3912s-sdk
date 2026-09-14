import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.rmtcfg.enable";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<void, MngtAck>;

describe("mngt rmtcfg enable (destructive -- exposes management to the Internet; fake transport only, never invoked against anything real)", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("mngt rmtcfg enable");
  });

  it("parses the documented short acknowledgement as an ack", () => {
    const parsed = operation.parse(exchanges("%% Remote configure function has been enabled."));

    expect(parsed).toEqual({ raw: "%% Remote configure function has been enabled." });
  });

  it("is linked in the manifest as implemented, classification destructive, matching the TypedOperation's classification", () => {
    assertManifestLinkage(MANIFEST_ID, "destructive");
    expect(operation.classification).toBe("destructive");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames()[0]);
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "%% Remote configure function has been enabled.",
    );

    expect(stdout).toContain("enabled");
    await expectClosedTransportFailure(command);
  });
});
