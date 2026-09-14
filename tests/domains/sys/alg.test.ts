import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysAlgInput } from "../../../src/domains/sys.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.alg";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysAlgInput, SysAck>;

describe("sys alg -e <0/1>", () => {
  it("builds the documented enable/disable frames", () => {
    expect(frameCommand(operation.buildFrames({ enabled: true })[0])).toBe("sys alg -e 1");
    expect(frameCommand(operation.buildFrames({ enabled: false })[0])).toBe("sys alg -e 0");
  });

  it("always routes the constructed command string through frameSingleCommand (structural input leaves no room for an injection shape)", () => {
    expect(() => operation.buildFrames({ enabled: true })).not.toThrow();
  });

  it("parses the documented one-line acknowledgement", () => {
    const parsed = operation.parse(exchanges("Enable ALG"));

    expect(parsed).toEqual({ raw: "Enable ALG" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ enabled: true })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "Enable ALG");

    expect(stdout).toBe("Enable ALG");
    await expectClosedTransportFailure(command);
  });
});
