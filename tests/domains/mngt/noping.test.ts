import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtNopingInput } from "../../../src/domains/mngt.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.noping";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtNopingInput, MngtAck>;

describe("mngt noping <on|off|viewlog|clearlog>", () => {
  it("builds the documented action frames", () => {
    expect(frameCommand(operation.buildFrames({ action: "off" })[0])).toBe("mngt noping off");
    expect(frameCommand(operation.buildFrames({ action: "viewlog" })[0])).toBe(
      "mngt noping viewlog",
    );
  });

  it("rejects an action outside the four documented values", () => {
    expect(() => operation.buildFrames({ action: "bogus" as MngtNopingInput["action"] })).toThrow(
      /mngt noping action must be one of/,
    );
  });

  it("parses the documented short acknowledgement as an ack", () => {
    const parsed = operation.parse(exchanges("No Ping Packet Out is OFF!!"));

    expect(parsed).toEqual({ raw: "No Ping Packet Out is OFF!!" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ action: "off" })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
