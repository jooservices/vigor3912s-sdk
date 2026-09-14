import { describe, expect, it } from "vitest";

import { apmSyslog } from "../../../src/domains/apm.js";
import { parseSyslog } from "../../../src/internal/parsers/apm/syslog.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.syslog -- apm syslog", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmSyslog.buildFrames(undefined));

    expect(frame.command).toBe("apm syslog");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSyslog('"2021-01-04 04:12:59", "[APM] GET temper/traffic data failed"\n')).toEqual({
      raw: '"2021-01-04 04:12:59", "[APM] GET temper/traffic data failed"',
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(apmSyslog, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmSyslog.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      '"2021-01-04 04:12:59", "[APM] GET temper/traffic data failed"',
    );

    expect(stdout).toBe('"2021-01-04 04:12:59", "[APM] GET temper/traffic data failed"');
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseSyslog", () => {
    expect(
      apmSyslog.parse([exchange('"2021-01-04 04:12:59", "[APM] GET temper/traffic data failed"')]),
    ).toEqual(parseSyslog('"2021-01-04 04:12:59", "[APM] GET temper/traffic data failed"'));
  });
});
