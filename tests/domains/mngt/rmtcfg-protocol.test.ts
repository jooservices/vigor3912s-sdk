import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { MngtRmtcfgProtocolInput } from "../../../src/domains/mngt.js";
import type { MngtAck } from "../../../src/internal/parsers/mngt/ack.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getMngtOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.mngt.rmtcfg.protocol";
const operation = getMngtOperation(MANIFEST_ID) as TypedOperation<MngtRmtcfgProtocolInput, MngtAck>;

describe("mngt rmtcfg <protocol> on|off", () => {
  it("builds the documented protocol on/off frames", () => {
    expect(frameCommand(operation.buildFrames({ protocol: "ftp", onOff: "on" })[0])).toBe(
      "mngt rmtcfg ftp on",
    );
    expect(
      frameCommand(operation.buildFrames({ protocol: "enforce_https", onOff: "off" })[0]),
    ).toBe("mngt rmtcfg enforce_https off");
  });

  it("rejects an invalid protocol name", () => {
    expect(() =>
      operation.buildFrames({
        protocol: "bogus" as MngtRmtcfgProtocolInput["protocol"],
        onOff: "on",
      }),
    ).toThrow(/mngt rmtcfg protocol must be one of/);
  });

  it("rejects an invalid on/off value", () => {
    expect(() =>
      operation.buildFrames({
        protocol: "ftp",
        onOff: "enable" as MngtRmtcfgProtocolInput["onOff"],
      }),
    ).toThrow(/mngt rmtcfg on\/off value must be one of/);
  });

  it("parses the documented acknowledgement as an ack", () => {
    const parsed = operation.parse(exchanges("%% FTP server has been enabled."));

    expect(parsed).toEqual({ raw: "%% FTP server has been enabled." });
  });

  it("is linked in the manifest as implemented, classification write", () => {
    assertManifestLinkage(MANIFEST_ID, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = frameCommand(operation.buildFrames({ protocol: "ftp", onOff: "on" })[0]);
    const { stdout } = await dispatchThroughFakeTransport(command, "");

    expect(stdout).toBe("");
    await expectClosedTransportFailure(command);
  });
});
