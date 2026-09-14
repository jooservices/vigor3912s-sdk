import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtDefenseWormInput } from "../../../src/domains/mngt.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.defenseworm";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtDefenseWormInput, MngtAck>;

describe("mngt defenseworm <on|off|viewlog|clearlog|add <port>|del <port>>", () => {
  it("builds the documented simple-action and add/del-port frames", () => {
    expect(frameCommand(operation.buildFrames({ action: "on" })[0])).toBe("mngt defenseworm on");
    expect(frameCommand(operation.buildFrames({ action: "add", port: 21 })[0])).toBe(
      "mngt defenseworm add 21",
    );
    expect(frameCommand(operation.buildFrames({ action: "del", port: 21 })[0])).toBe(
      "mngt defenseworm del 21",
    );
  });

  it("rejects an unrecognized simple action and an out-of-range port", () => {
    expect(() => operation.buildFrames({ action: "bogus" as "on" })).toThrow(
      /mngt defenseworm action must be one of/,
    );
    expect(() => operation.buildFrames({ action: "add", port: 70000 })).toThrow(
      /integer between 1 and 65535/,
    );
  });

  it("parses the documented block-list acknowledgement as an ack", () => {
    const parsed = operation.parse(exchanges("Block TCP port list: 135, 137, 138, 139, 445, 21"));

    expect(parsed).toEqual({ raw: "Block TCP port list: 135, 137, 138, 139, 445, 21" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ action: "on" })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
