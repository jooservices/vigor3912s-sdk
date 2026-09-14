import { describe, expect, it } from "vitest";

import { ipIgmpProxyVersion } from "../../../src/domains/ip.js";
import { parseIgmpProxyVersion } from "../../../src/internal/parsers/ip/igmpproxy-version.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpproxy.version -- ip igmp_proxy version", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipIgmpProxyVersion.buildFrames({ version: "v2" })).command).toBe(
      "ip igmp_proxy version v2",
    );
    expect(firstFrame(ipIgmpProxyVersion.buildFrames({ version: "v3" })).command).toBe(
      "ip igmp_proxy version v3",
    );
    expect(firstFrame(ipIgmpProxyVersion.buildFrames({ version: "auto" })).command).toBe(
      "ip igmp_proxy version auto",
    );
    expect(firstFrame(ipIgmpProxyVersion.buildFrames({ version: "show" })).command).toBe(
      "ip igmp_proxy version show",
    );

    expect(() => ipIgmpProxyVersion.buildFrames({ version: "v1" as unknown as "v2" })).toThrow(
      /version/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpProxyVersion("IGMP version set to v3\n")).toEqual({
      raw: "IGMP version set to v3",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpProxyVersion, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpProxyVersion.buildFrames({ version: "v2" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "IGMP version set to v3\n");

    expect(stdout).toBe("IGMP version set to v3\n");

    expect(ipIgmpProxyVersion.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
