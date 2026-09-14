import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtLanaccessInput } from "../../../src/domains/mngt.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.lanaccess";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtLanaccessInput, MngtAck>;

describe("mngt lanaccess [-<flag> <param> | ...]", () => {
  it("builds the documented flagged frame", () => {
    const [frame] = operation.buildFrames({ args: ["-e", "1", "-s", "FTP", "-i", "LAN1"] });

    expect(frameCommand(frame)).toBe("mngt lanaccess -e 1 -s FTP -i LAN1");
  });

  it("rejects an empty args array and an unrecognized flag", () => {
    expect(() => operation.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => operation.buildFrames({ args: ["-z"] })).toThrow(
      /is not one of the documented flags/,
    );
  });

  it("rejects an injection attempt embedded in an argument token", () => {
    expect(() => operation.buildFrames({ args: ["-i", "LAN1;sys reboot"] })).toThrow(
      /must not contain whitespace|disallowed sequence/,
    );
  });

  it("parses the documented current-setting output as an ack (no structured table is documented here)", () => {
    const parsed = operation.parse(exchanges("Current LAN Access Control Setting:"));

    expect(parsed).toEqual({ raw: "Current LAN Access Control Setting:" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ args: ["-v"] })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
