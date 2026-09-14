import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.tftpd";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysAck>;

describe("sys tftpd", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys tftpd");
  });

  it("parses the documented one-line acknowledgement", () => {
    const parsed = operation.parse(exchanges("% TFTP server enabled !!!"));

    expect(parsed).toEqual({ raw: "% TFTP server enabled !!!" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames()[0]),
      "% TFTP server enabled !!!",
    );

    expect(stdout).toContain("TFTP server enabled");
    await expectClosedTransportFailure("sys tftpd");
  });
});
