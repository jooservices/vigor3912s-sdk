import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysDashboard } from "../../../src/internal/parsers/sys/dashboard.js";
import {
  assertManifestClassification,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.dashboard";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysDashboard>;

const SAMPLE = [
  "Front Panel enabled",
  "System Information enabled",
  "IPv4 LAN Information enabled",
  "",
].join("\n");

describe("sys dashboard", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys dashboard");
  });

  it("trims the free-form dashboard section text", () => {
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

    expect(stdout).toContain("Front Panel");
    await expectClosedTransportFailure("sys dashboard");
  });
});
