import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysQryBuf } from "../../../src/internal/parsers/sys/qrybuf.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.qrybuf";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysQryBuf>;

const SAMPLE = `System Memory Status and Leakage List

Buf sk_buff  ( 200B), used#: 1647, cached#:   30`;

describe("sys qrybuf", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys qrybuf");
  });

  it("trims the documented free-form memory/buffer table (not further structured -- see parser doc comment)", () => {
    const parsed = operation.parse(exchanges(`  ${SAMPLE}  `));

    expect(parsed).toEqual({ raw: SAMPLE });
  });

  it("is linked in the manifest as implemented, classification read", () => {
    assertManifestLinkage(MANIFEST_ID, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames()[0]),
      SAMPLE,
    );

    expect(stdout).toContain("Memory Status");
    await expectClosedTransportFailure("sys qrybuf");
  });
});
