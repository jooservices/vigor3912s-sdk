import { describe, expect, it } from "vitest";

import { csmAppeConfig } from "../../../src/domains/csm.js";
import { parseAppeConfig } from "../../../src/internal/parsers/csm/appe-config.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "OTHERS Tunneling 75 CloudFlare Disable\n";

describe("cli.csm.appe.config", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(csmAppeConfig.buildFrames({ index: 1, group: "others" }));

    expect(frame.command).toBe("csm appe config -v 1 -m");
    expect(() => csmAppeConfig.buildFrames({ index: 33, group: "others" })).toThrow(/index/);
    expect(() => csmAppeConfig.buildFrames({ index: 1, group: "bogus" as never })).toThrow(/group/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseAppeConfig(SAMPLE_TEXT)).toEqual({
      raw: "OTHERS Tunneling 75 CloudFlare Disable",
    });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(csmAppeConfig.parse([exchange(SAMPLE_TEXT)])).toEqual(parseAppeConfig(SAMPLE_TEXT));
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(csmAppeConfig, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(csmAppeConfig.buildFrames({ index: 1, group: "others" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "OTHERS Tunneling 75 CloudFlare Disable",
    );

    expect(stdout).toBe("OTHERS Tunneling 75 CloudFlare Disable");
    await expectClosedTransportFailure(command);
  });
});
