import { describe, expect, it } from "vitest";

import { ipIgmpProxyWan } from "../../../src/domains/ip.js";
import { parseIgmpProxyWan } from "../../../src/internal/parsers/ip/igmpproxy-wan.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpproxy.wan -- ip igmp_proxy wan", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipIgmpProxyWan.buildFrames()).command).toBe("ip igmp_proxy wan");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpProxyWan("igmp_proxy WAN selected\n")).toEqual({
      raw: "igmp_proxy WAN selected",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpProxyWan, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpProxyWan.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "igmp_proxy WAN selected\n");

    expect(stdout).toBe("igmp_proxy WAN selected\n");

    expect(ipIgmpProxyWan.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
