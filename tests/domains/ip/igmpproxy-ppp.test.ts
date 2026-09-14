import { describe, expect, it } from "vitest";

import { ipIgmpProxyPpp } from "../../../src/domains/ip.js";
import { parseIgmpProxyPpp } from "../../../src/internal/parsers/ip/igmpproxy-ppp.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpproxy.ppp -- ip igmp_proxy ppp", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpProxyPpp.buildFrames({ enabled: true })).command).toBe(
      "ip igmp_proxy ppp 1",
    );
    expect(firstFrame(ipIgmpProxyPpp.buildFrames({ enabled: false })).command).toBe(
      "ip igmp_proxy ppp 0",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpProxyPpp("IGMP PPP header set\n")).toEqual({
      raw: "IGMP PPP header set",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpProxyPpp, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpProxyPpp.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "IGMP PPP header set\n");

    expect(stdout).toBe("IGMP PPP header set\n");

    expect(ipIgmpProxyPpp.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
