import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.cfg.status";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<
  void,
  { readonly profileVersion: string; readonly status: string }
>;

describe("sys cfg status", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys cfg status");
  });

  it("parses the documented profile version/status line", () => {
    const parsed = operation.parse(exchanges("Profile version: 4.0.7    Status: 1 (0x491e5e6c)"));

    expect(parsed).toEqual({ profileVersion: "4.0.7", status: "1 (0x491e5e6c)" });
  });

  it("returns empty strings for text that doesn't match the documented shape", () => {
    const parsed = operation.parse(exchanges("% Command Error"));

    expect(parsed).toEqual({ profileVersion: "", status: "" });
  });

  it("is linked in the manifest as implemented, classification read", () => {
    assertManifestLinkage(MANIFEST_ID, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames()[0]),
      "Profile version: 4.0.7    Status: 1 (0x491e5e6c)",
    );

    expect(stdout).toContain("Profile version");
    await expectClosedTransportFailure("sys cfg status");
  });
});
