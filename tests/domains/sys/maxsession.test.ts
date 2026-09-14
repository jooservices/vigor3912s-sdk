import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysMaxSession } from "../../../src/internal/parsers/sys/maxsession.js";
import {
  assertManifestClassification,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.maxsession";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysMaxSession>;

const SAMPLE = "Current MAX sessions : 300K";

describe("sys max_session", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys max_session");
  });

  it("trims the free-form max-session text", () => {
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

    expect(stdout).toContain("MAX sessions");
    await expectClosedTransportFailure("sys max_session");
  });
});
