import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtPortInput } from "../../../src/domains/mngt.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.httpport";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtPortInput, MngtAck>;

describe("mngt httpport <port>", () => {
  it("builds the documented port frame", () => {
    const [frame] = operation.buildFrames({ port: 80 });

    expect(frameCommand(frame)).toBe("mngt httpport 80");
  });

  it("rejects a non-integer and an out-of-range port", () => {
    expect(() => operation.buildFrames({ port: 0.1 })).toThrow(/integer between 1 and 65535/);
    expect(() => operation.buildFrames({ port: 0 })).toThrow(/integer between 1 and 65535/);
  });

  it("parses the documented short acknowledgement as an ack", () => {
    const parsed = operation.parse(exchanges("% ok"));

    expect(parsed).toEqual({ raw: "% ok" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ port: 80 })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "% ok");

    expect(stdout).toBe("% ok");
    await expectClosedTransportFailure(command);
  });
});
