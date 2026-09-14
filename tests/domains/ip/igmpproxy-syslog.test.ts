import { describe, expect, it } from "vitest";

import { ipIgmpProxySyslog } from "../../../src/domains/ip.js";
import { parseIgmpProxySyslog } from "../../../src/internal/parsers/ip/igmpproxy-syslog.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpproxy.syslog -- ip igmp_proxy syslog", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpProxySyslog.buildFrames({ enabled: true })).command).toBe(
      "ip igmp_proxy syslog 1",
    );
    expect(firstFrame(ipIgmpProxySyslog.buildFrames({ enabled: false })).command).toBe(
      "ip igmp_proxy syslog 0",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpProxySyslog("IGMP syslog enabled\n")).toEqual({
      raw: "IGMP syslog enabled",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpProxySyslog, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpProxySyslog.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "IGMP syslog enabled\n");

    expect(stdout).toBe("IGMP syslog enabled\n");

    expect(ipIgmpProxySyslog.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
