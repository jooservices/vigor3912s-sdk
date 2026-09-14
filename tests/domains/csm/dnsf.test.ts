import { describe, expect, it } from "vitest";

import { csmDnsf } from "../../../src/domains/csm.js";
import { parseDnsf } from "../../../src/internal/parsers/csm/dnsf.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

describe("cli.csm.dnsf -- csm dnsf enable|syslog|wcf|ucf|cachetime|blockpage|profile_* ...", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    expect(firstFrame(csmDnsf.buildFrames({ action: "enable", state: "ON" })).command).toBe(
      "csm dnsf enable ON",
    );
    expect(firstFrame(csmDnsf.buildFrames({ action: "syslog", value: "A" })).command).toBe(
      "csm dnsf syslog A",
    );
    expect(firstFrame(csmDnsf.buildFrames({ action: "wcf", index: 1 })).command).toBe(
      "csm dnsf wcf 1",
    );
    expect(firstFrame(csmDnsf.buildFrames({ action: "ucf", index: 2 })).command).toBe(
      "csm dnsf ucf 2",
    );
    expect(firstFrame(csmDnsf.buildFrames({ action: "cachetime", hours: 20 })).command).toBe(
      "csm dnsf cachetime 20",
    );
    expect(firstFrame(csmDnsf.buildFrames({ action: "blockpage", value: "on" })).command).toBe(
      "csm dnsf blockpage on",
    );
    expect(firstFrame(csmDnsf.buildFrames({ action: "profileShow" })).command).toBe(
      "csm dnsf profile_show",
    );
    expect(
      firstFrame(csmDnsf.buildFrames({ action: "profileEditName", index: 1, name: "myfilter" }))
        .command,
    ).toBe("csm dnsf profile_edit 1 -n myfilter");
    expect(
      firstFrame(csmDnsf.buildFrames({ action: "profileEditLog", index: 1, logType: "B" })).command,
    ).toBe("csm dnsf profile_edit 1 -l B");
    expect(firstFrame(csmDnsf.buildFrames({ action: "profileSetdefault" })).command).toBe(
      "csm dnsf profile_setdefault",
    );

    expect(() => csmDnsf.buildFrames({ action: "cachetime", hours: 25 })).toThrow(/hours/);
    expect(() => csmDnsf.buildFrames({ action: "wcf", index: 9 })).toThrow(/index/);
    expect(() => csmDnsf.buildFrames({ action: "enable", state: "MAYBE" as never })).toThrow(
      /state/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDnsf("dns cache time set up!!!\n")).toEqual({ raw: "dns cache time set up!!!" });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(csmDnsf.parse([exchange("dns cache time set up!!!\n")])).toEqual(
      parseDnsf("dns cache time set up!!!\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(csmDnsf, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(csmDnsf.buildFrames({ action: "profileSetdefault" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "setdefault!!!");

    expect(stdout).toBe("setdefault!!!");
    await expectClosedTransportFailure(command);
  });
});
