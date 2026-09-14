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

const MANIFEST_ID = "cli.mngt.rmtcfg.status";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<void, MngtAck>;

describe("mngt rmtcfg status", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("mngt rmtcfg status");
  });

  it("parses the documented short status text as an ack (no structured table is documented)", () => {
    const parsed = operation.parse(exchanges("Remote configure function has been disabled"));

    expect(parsed).toEqual({ raw: "Remote configure function has been disabled" });
  });

  it("is linked in the manifest as implemented, classification read", () => {
    assertManifestLinkage(MANIFEST_ID, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames()[0]),
      "Remote configure function has been disabled",
    );

    expect(stdout).toContain("disabled");
    await expectClosedTransportFailure("mngt rmtcfg status");
  });
});
