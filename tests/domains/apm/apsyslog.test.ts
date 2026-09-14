import { describe, expect, it } from "vitest";

import { apmApsyslog } from "../../../src/domains/apm.js";
import { parseApsyslog } from "../../../src/internal/parsers/apm/apsyslog.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE = "8d 02:46:09  syslog: [APM] Send Rogue AP Detection data.\n";

describe("cli.apm.apsyslog -- apm apsyslog <AP_Index>", () => {
  it("builds the documented frame and rejects non-positive input", () => {
    const frame = firstFrame(apmApsyslog.buildFrames({ apIndex: 1 }));

    expect(frame.command).toBe("apm apsyslog 1");
    expect(() => apmApsyslog.buildFrames({ apIndex: 0 })).toThrow(/apIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseApsyslog(SAMPLE)).toEqual({
      raw: "8d 02:46:09  syslog: [APM] Send Rogue AP Detection data.",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(apmApsyslog, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmApsyslog.buildFrames({ apIndex: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "8d 02:46:09  syslog: [APM] Send Rogue AP Detection data.",
    );

    expect(stdout).toBe("8d 02:46:09  syslog: [APM] Send Rogue AP Detection data.");
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseApsyslog", () => {
    expect(apmApsyslog.parse([exchange(SAMPLE)])).toEqual(parseApsyslog(SAMPLE));
  });
});
