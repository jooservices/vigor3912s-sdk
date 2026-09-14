import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtAccesslistInput } from "../../../src/domains/mngt.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.accesslist";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtAccesslistInput, MngtAck>;

describe("mngt accesslist <list|add|remove|flush> [args...]", () => {
  it("builds the documented subcommand frames", () => {
    expect(frameCommand(operation.buildFrames({ args: ["list"] })[0])).toBe("mngt accesslist list");
    expect(frameCommand(operation.buildFrames({ args: ["add", "ip", "1", "1"] })[0])).toBe(
      "mngt accesslist add ip 1 1",
    );
  });

  it("rejects an empty args array and an unrecognized subcommand", () => {
    expect(() => operation.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => operation.buildFrames({ args: ["bogus"] })).toThrow(/subcommand must be one of/);
  });

  it("rejects an injection attempt embedded in an argument token", () => {
    expect(() => operation.buildFrames({ args: ["add", "ip;sys reboot", "1", "1"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("parses the documented list-output acknowledgement as an ack (no structured table is documented here)", () => {
    const parsed = operation.parse(exchanges("%% Access list :"));

    expect(parsed).toEqual({ raw: "%% Access list :" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ args: ["flush"] })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
