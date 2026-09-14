import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysPasswdInput } from "../../../src/domains/sys.js";
import type { SysAck } from "../../../src/internal/parsers/sys/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.passwd";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<SysPasswdInput, SysAck>;

describe("sys passwd <old> <new>", () => {
  it("builds the documented frame", () => {
    const [frame] = operation.buildFrames({ oldPassword: "old-pw", newPassword: "new-pw" });

    expect(frameCommand(frame)).toBe("sys passwd old-pw new-pw");
  });

  it("rejects empty/whitespace/over-length passwords and an injection attempt", () => {
    expect(() => operation.buildFrames({ oldPassword: "", newPassword: "new-pw" })).toThrow(
      /must not be empty/,
    );
    expect(() => operation.buildFrames({ oldPassword: "old pw", newPassword: "new-pw" })).toThrow(
      /must not contain whitespace/,
    );
    expect(() =>
      operation.buildFrames({ oldPassword: "x".repeat(84), newPassword: "new-pw" }),
    ).toThrow(/at most 83 characters/);
    expect(() => operation.buildFrames({ oldPassword: "old-pw", newPassword: "new$(id)" })).toThrow(
      /disallowed sequence/,
    );
  });

  it("parses the documented bare-prompt output as an ack (no password is ever echoed)", () => {
    const parsed = operation.parse(exchanges(""));

    expect(parsed).toEqual({ raw: "" });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(
      operation.buildFrames({ oldPassword: "old-pw", newPassword: "new-pw" })[0],
    );
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
