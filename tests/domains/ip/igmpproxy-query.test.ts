import { describe, expect, it } from "vitest";

import { ipIgmpProxyQuery } from "../../../src/domains/ip.js";
import { parseIgmpProxyQuery } from "../../../src/internal/parsers/ip/igmpproxy-query.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpproxy.query -- ip igmp_proxy query", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipIgmpProxyQuery.buildFrames({ intervalMs: 125000 })).command).toBe(
      "ip igmp_proxy query 125000",
    );

    expect(() => ipIgmpProxyQuery.buildFrames({ intervalMs: -1 })).toThrow(/intervalMs/);
    expect(() => ipIgmpProxyQuery.buildFrames({ intervalMs: 125.5 })).toThrow(
      /intervalMs must be an integer/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpProxyQuery("IGMP query interval set\n")).toEqual({
      raw: "IGMP query interval set",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpProxyQuery, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipIgmpProxyQuery.buildFrames({ intervalMs: 125000 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "IGMP query interval set\n");

    expect(stdout).toBe("IGMP query interval set\n");

    expect(ipIgmpProxyQuery.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
