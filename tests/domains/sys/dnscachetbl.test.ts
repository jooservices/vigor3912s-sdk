import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysDnsCacheTbl } from "../../../src/internal/parsers/sys/dnscachetbl.js";
import {
  assertManifestClassification,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.dnscachetbl";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysDnsCacheTbl>;

const SAMPLE = [
  "DNS Cache Table:",
  "Idx  Domain            TTL    Address",
  "1    example.com       300    93.184.216.34",
  "",
].join("\n");

describe("sys dnsCacheTbl", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys dnsCacheTbl");
  });

  it("trims the free-form DNS cache table text", () => {
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

    expect(stdout).toContain("DNS Cache Table");
    await expectClosedTransportFailure("sys dnsCacheTbl");
  });
});
