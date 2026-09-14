import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysCmdLog } from "../../../src/internal/parsers/sys/cmdlog.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.cmdlog";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysCmdLog>;

const SAMPLE = `% Commands Log: (The lowest index is the newest !!!)
    [1] sys cmdlog
    [2] sys cmdlog ?
    [3] sys ?
    [4] sys cfg status
    [5] sys cfg ?`;

describe("sys cmdlog", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys cmdlog");
  });

  it("parses the documented indexed command-history list", () => {
    const parsed = operation.parse(exchanges(SAMPLE));

    expect(parsed.entries).toEqual([
      { index: 1, command: "sys cmdlog" },
      { index: 2, command: "sys cmdlog ?" },
      { index: 3, command: "sys ?" },
      { index: 4, command: "sys cfg status" },
      { index: 5, command: "sys cfg ?" },
    ]);
  });

  it("is linked in the manifest as implemented, classification read", () => {
    assertManifestLinkage(MANIFEST_ID, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames()[0]),
      SAMPLE,
    );

    expect(stdout).toContain("Commands Log");
    await expectClosedTransportFailure("sys cmdlog");
  });
});
