import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysFrLog } from "../../../src/internal/parsers/sys/frlog.js";
import {
  assertManifestClassification,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.frlog";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysFrLog>;

const SAMPLE = [
  "-----------------------------------------------------------------",
  "No failure log entries.",
  "",
].join("\n");

describe("sys fr_log", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys fr_log");
  });

  it("trims the free-form failure-log text", () => {
    const parsed = operation.parse(exchanges(`  ${SAMPLE}  `));

    expect(parsed).toEqual({ raw: SAMPLE.trim() });
  });

  it("is linked in the manifest as classification read", () => {
    assertManifestClassification(MANIFEST_ID, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames()[0]),
      SAMPLE,
    );

    expect(stdout).toContain("failure log");
    await expectClosedTransportFailure("sys fr_log");
  });
});
