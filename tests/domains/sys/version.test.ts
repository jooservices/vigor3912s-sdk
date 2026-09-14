import { describe, expect, it } from "vitest";

import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { SysVersion } from "../../../src/internal/parsers/sys/version.js";
import {
  assertManifestLinkage,
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
  frameCommand,
  getSysOperation,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.sys.version";
const operation = getSysOperation(MANIFEST_ID) as TypedOperation<void, SysVersion>;

// `.ai/skills/vigor3912s/references/command-map.md`'s "sys version example output" block.
const SAMPLE = `Router Model: Vigor3912S    Version: 4.3.5 zh_TW zh_CN
Profile version: 4.0.7    Status: 1 (0x14bc0da9)
Router IP: 192.168.1.1    Netmask: 255.255.255.0
Firmware Build Date/Time: Nov 13 2023 16:38:20
Router Name: DrayTek
Revision: 3682_4564_a39c288 V400_RD3`;

describe("sys version", () => {
  it("builds the documented no-argument frame", () => {
    const [frame] = operation.buildFrames();

    expect(frameCommand(frame)).toBe("sys version");
  });

  it("parses the documented sample output block", () => {
    const parsed = operation.parse(exchanges(SAMPLE));

    expect(parsed).toEqual({
      routerModel: "Vigor3912S",
      version: "4.3.5 zh_TW zh_CN",
      profileVersion: "4.0.7",
      status: "1 (0x14bc0da9)",
      routerIp: "192.168.1.1",
      netmask: "255.255.255.0",
      firmwareBuildDateTime: "Nov 13 2023 16:38:20",
      routerName: "DrayTek",
      revision: "3682_4564_a39c288 V400_RD3",
    });
  });

  it("returns empty strings for text that doesn't match the documented shape", () => {
    const parsed = operation.parse(exchanges("% Command Error"));

    expect(parsed).toEqual({
      routerModel: "",
      version: "",
      profileVersion: "",
      status: "",
      routerIp: "",
      netmask: "",
      firmwareBuildDateTime: "",
      routerName: "",
      revision: "",
    });
  });

  it("is linked in the manifest as implemented, classification read", () => {
    assertManifestLinkage(MANIFEST_ID, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      frameCommand(operation.buildFrames()[0]),
      SAMPLE,
    );

    expect(stdout).toContain("Vigor3912S");
    await expectClosedTransportFailure("sys version");
  });
});
