import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysCc } from "../../../src/internal/parsers/sys/cc.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.cc";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysCc>;

const SAMPLE = `Country Code        : 0x 0 [International]
Wireless Region Code: 0x30`;

describe("sys cc", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys cc");
  });

  it("parses the documented country/wireless region code lines", () => {
    const parsed = operation.parse(exchanges(SAMPLE));

    expect(parsed).toEqual({
      countryCode: "0x 0 [International]",
      wirelessRegionCode: "0x30",
    });
  });

  it("returns empty strings for text that doesn't match the documented shape", () => {
    const parsed = operation.parse(exchanges("% Command Error"));

    expect(parsed).toEqual({ countryCode: "", wirelessRegionCode: "" });
  });

  it("is linked in the manifest as implemented, classification read", () => {
    assertManifestLinkage(MANIFEST_ID, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames()[0]),
      SAMPLE,
    );

    expect(stdout).toContain("Country Code");
    await expectClosedTransportFailure("sys cc");
  });
});
