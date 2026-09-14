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

const MANIFEST_ID = "cli.mngt.rmtcfg.disable";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<void, MngtAck>;

describe("mngt rmtcfg disable", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("mngt rmtcfg disable");
  });

  it("parses the documented short acknowledgement as an ack", () => {
    const parsed = operation.parse(exchanges("%% Remote configure function has been disabled."));

    expect(parsed).toEqual({ raw: "%% Remote configure function has been disabled." });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames()[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
