import { describe, expect, it } from "vitest";

import { vigbrgCfgip } from "../../../src/domains/vigbrg.js";
import { parseCfgip } from "../../../src/internal/parsers/vigbrg/cfgip.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "% Now: 192.168.1.15\n";

describe("cli.vigbrg.cfgip -- vigbrg cfgip", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vigbrgCfgip.buildFrames({ ip: "192.168.1.15" }));

    expect(frame.command).toBe("vigbrg cfgip 192.168.1.15");
    expect(() => vigbrgCfgip.buildFrames({ ip: "" })).toThrow(/ip/);
    expect(() => vigbrgCfgip.buildFrames({ ip: "192.168.1.15 bad" })).toThrow(/ip/);
    expect(() => vigbrgCfgip.buildFrames({ ip: "999.168.1.15" })).toThrow(/IPv4/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseCfgip(SAMPLE_TEXT)).toEqual({
      raw: "% Now: 192.168.1.15",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vigbrgCfgip, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vigbrgCfgip.buildFrames({ ip: "192.168.1.15" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseCfgip", () => {
    expect(vigbrgCfgip.parse([exchange(SAMPLE_TEXT)])).toEqual(parseCfgip(SAMPLE_TEXT));
  });
});
