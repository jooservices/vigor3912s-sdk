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

const MANIFEST_ID = "cli.mngt.sshtimeout";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtTimeoutInput, MngtTimeoutAck>;

describe("mngt sshtimeout <value>", () => {
  it("builds the documented seconds frame", () => {
    const [frame] = operation.buildFrames({ seconds: 200 });

    expect(frameCommand(frame)).toBe("mngt sshtimeout 200");
  });

  it("rejects a value outside the documented 60-300 range", () => {
    expect(() => operation.buildFrames({ seconds: 59 })).toThrow(/integer between 60 and 300/);
    expect(() => operation.buildFrames({ seconds: 301 })).toThrow(/integer between 60 and 300/);
  });

  it("parses the documented seconds acknowledgement", () => {
    const parsed = operation.parse(exchanges("% SSH timeout : 200s"));

    expect(parsed).toEqual({ seconds: 200 });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ seconds: 200 })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "% SSH timeout : 200s");

    expect(stdout).toBe("% SSH timeout : 200s");
    await expectClosedTransportFailure(command);
  });
});
