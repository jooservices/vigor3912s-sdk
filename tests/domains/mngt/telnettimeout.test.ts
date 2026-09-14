import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtTimeoutInput } from "../../../src/domains/mngt.js";
import type { MngtTimeoutAck } from "../../../src/internal/parsers/mngt/timeout.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.telnettimeout";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtTimeoutInput, MngtTimeoutAck>;

describe("mngt telnettimeout <value>", () => {
  it("builds the documented seconds frame", () => {
    const [frame] = operation.buildFrames({ seconds: 100 });

    expect(frameCommand(frame)).toBe("mngt telnettimeout 100");
  });

  it("rejects a value outside the documented 60-300 range", () => {
    expect(() => operation.buildFrames({ seconds: 59 })).toThrow(/integer between 60 and 300/);
    expect(() => operation.buildFrames({ seconds: 301 })).toThrow(/integer between 60 and 300/);
  });

  it("parses the documented seconds acknowledgement", () => {
    const parsed = operation.parse(exchanges("% Telnet timeout : 100s"));

    expect(parsed).toEqual({ seconds: 100 });
  });

  it("returns a null seconds value for an unexpected acknowledgement", () => {
    const parsed = operation.parse(exchanges("% Command Error"));

    expect(parsed).toEqual({ seconds: null });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ seconds: 100 })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "% Telnet timeout : 100s");

    expect(stdout).toBe("% Telnet timeout : 100s");
    await expectClosedTransportFailure(command);
  });
});
