import { describe, expect, it } from "vitest";

import { ipIgmpProxyStatus } from "../../../src/domains/ip.js";
import { parseIgmpProxyStatus } from "../../../src/internal/parsers/ip/igmpproxy-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpproxy.status -- ip igmp_proxy status", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpProxyStatus.buildFrames()).command).toBe("ip igmp_proxy status");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseIgmpProxyStatus("%% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is ON\n"),
    ).toEqual({
      raw: "%% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is ON",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipIgmpProxyStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpProxyStatus.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "%% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is ON\n",
    );

    expect(stdout).toBe("%% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is ON\n");

    expect(ipIgmpProxyStatus.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
