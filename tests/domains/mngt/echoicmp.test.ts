import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtEchoIcmpInput } from "../../../src/domains/mngt.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.echoicmp";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtEchoIcmpInput, MngtAck>;

describe("mngt echoicmp <enable|disable>", () => {
  it("builds the documented action frames", () => {
    expect(frameCommand(operation.buildFrames({ action: "enable" })[0])).toBe(
      "mngt echoicmp enable",
    );
    expect(frameCommand(operation.buildFrames({ action: "disable" })[0])).toBe(
      "mngt echoicmp disable",
    );
  });

  it("rejects an action outside enable/disable", () => {
    expect(() => operation.buildFrames({ action: "on" as MngtEchoIcmpInput["action"] })).toThrow(
      /mngt echoicmp action must be one of/,
    );
  });

  it("parses the documented short acknowledgement as an ack", () => {
    const parsed = operation.parse(exchanges("%% Echo ICMP packet enabled."));

    expect(parsed).toEqual({ raw: "%% Echo ICMP packet enabled." });
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
