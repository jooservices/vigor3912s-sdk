import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysTime } from "../../../src/internal/parsers/sys/time.js";
import {
  assertManifestClassification,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.time";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysTime>;

const SAMPLE = "Current System Time: 2026-09-13 12:00:00";

describe("sys time", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys time");
  });

  it("trims the free-form system-time text", () => {
    const parsed = operation.parse(exchanges(`  ${SAMPLE}  `));

    expect(parsed).toEqual({ raw: SAMPLE });
  });

  it("is linked in the manifest as classification read", () => {
    assertManifestClassification(MANIFEST_ID, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames()[0]),
      SAMPLE,
    );

    expect(stdout).toContain("System Time");
    await expectClosedTransportFailure("sys time");
  });
});
