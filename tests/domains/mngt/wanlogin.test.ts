import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtWanloginInput } from "../../../src/domains/mngt.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.wanlogin";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtWanloginInput, MngtAck>;

describe("mngt wanlogin <enable|disable>", () => {
  it("builds the documented action frames", () => {
    expect(frameCommand(operation.buildFrames({ action: "enable" })[0])).toBe(
      "mngt wanlogin enable",
    );
    expect(frameCommand(operation.buildFrames({ action: "disable" })[0])).toBe(
      "mngt wanlogin disable",
    );
  });

  it("rejects an action outside enable/disable", () => {
    expect(() => operation.buildFrames({ action: "on" as MngtWanloginInput["action"] })).toThrow(
      /mngt wanlogin action must be one of/,
    );
  });

  it("parses the documented short acknowledgement as an ack", () => {
    const parsed = operation.parse(exchanges("%% wan login enabled."));

    expect(parsed).toEqual({ raw: "%% wan login enabled." });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ action: "enable" })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
