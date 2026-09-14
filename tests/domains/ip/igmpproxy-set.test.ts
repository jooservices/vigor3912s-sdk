import { describe, expect, it } from "vitest";

import { ipIgmpProxySet } from "../../../src/domains/ip.js";
import { parseIgmpProxySet } from "../../../src/internal/parsers/ip/igmpproxy-set.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpproxy.set -- ip igmp_proxy set", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpProxySet.buildFrames()).command).toBe("ip igmp_proxy set");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpProxySet("% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is ON\n")).toEqual(
      {
        raw: "% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is ON",
      },
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpProxySet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpProxySet.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is ON\n",
    );

    expect(stdout).toBe("% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is ON\n");

    expect(ipIgmpProxySet.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
