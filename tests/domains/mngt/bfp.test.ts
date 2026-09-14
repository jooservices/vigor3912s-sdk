import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtBfpInput } from "../../../src/domains/mngt.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.bfp";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtBfpInput, MngtAck>;

describe("mngt bfp [<command> <parameter> | ...]", () => {
  it("builds the documented flagged frame", () => {
    const [frame] = operation.buildFrames({ args: ["-e", "1"] });

    expect(frameCommand(frame)).toBe("mngt bfp -e 1");
  });

  it("rejects an empty args array and an unrecognized flag", () => {
    expect(() => operation.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => operation.buildFrames({ args: ["-z"] })).toThrow(
      /is not one of the documented flags/,
    );
  });

  it("rejects an injection attempt embedded in an argument token", () => {
    expect(() => operation.buildFrames({ args: ["-s", "FTP;sys reboot"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("parses the documented settings-summary acknowledgement as an ack (no structured table is documented here)", () => {
    const parsed = operation.parse(exchanges("Current Brute Force Protection Setting:"));

    expect(parsed).toEqual({ raw: "Current Brute Force Protection Setting:" });
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
