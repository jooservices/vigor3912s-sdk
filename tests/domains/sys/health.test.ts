import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysHealthInput } from "../../../src/domains/sys.js";
import type { SysHealth } from "../../../src/internal/parsers/sys/health.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.health";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysHealthInput, SysHealth>;

describe("sys health <metric>", () => {
  it("builds the documented metric frame", () => {
    const [frame] = operation.buildFrames({ metric: "cpu_usage" });

    expect(frameCommand(frame)).toBe("sys health cpu_usage");
  });

  it("rejects a metric outside the eight documented values", () => {
    expect(() =>
      operation.buildFrames({ metric: "bogus_metric" as SysHealthInput["metric"] }),
    ).toThrow(/sys health metric must be one of/);
  });

  it("trims the documented free-form health table (varies per metric -- see parser doc comment)", () => {
    const parsed = operation.parse(exchanges("  cpu usage: 12%  "));

    expect(parsed).toEqual({ raw: "cpu usage: 12%" });
  });

  it("is linked in the manifest as implemented, classification read", () => {
    assertManifestLinkage(MANIFEST_ID, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames({ metric: "view" })[0]),
      "health view output",
    );

    expect(stdout).toBe("health view output");
    await expectClosedTransportFailure("sys health view");
  });
});
