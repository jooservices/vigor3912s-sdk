import { describe, expect, it } from "vitest";

import { ipIgmpProxyReset } from "../../../src/domains/ip.js";
import { parseIgmpProxyReset } from "../../../src/internal/parsers/ip/igmpproxy-reset.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpproxy.reset -- ip igmp_proxy reset", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpProxyReset.buildFrames()).command).toBe("ip igmp_proxy reset");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseIgmpProxyReset("% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is OFF\n"),
    ).toEqual({
      raw: "% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is OFF",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpProxyReset, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpProxyReset.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is OFF\n",
    );

    expect(stdout).toBe("% ip igmp_proxy [set|reset|wan|status], IGMP Proxy is OFF\n");

    expect(ipIgmpProxyReset.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
