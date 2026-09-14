import { describe, expect, it } from "vitest";

import { ipIgmpSnoopTxquery } from "../../../src/domains/ip.js";
import { parseIgmpSnoopTxquery } from "../../../src/internal/parsers/ip/igmpsnoop-txquery.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.igmpsnoop.txquery -- ip igmp_snoop txquery", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(
      firstFrame(ipIgmpSnoopTxquery.buildFrames({ enabled: true, version: "v2" })).command,
    ).toBe("ip igmp_snoop txquery on v2");
    expect(
      firstFrame(ipIgmpSnoopTxquery.buildFrames({ enabled: false, version: "v3" })).command,
    ).toBe("ip igmp_snoop txquery off v3");

    expect(() =>
      ipIgmpSnoopTxquery.buildFrames({ enabled: true, version: "v1" as unknown as "v2" }),
    ).toThrow(/version/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIgmpSnoopTxquery("IGMP snoop txquery on v2\n")).toEqual({
      raw: "IGMP snoop txquery on v2",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipIgmpSnoopTxquery, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      ipIgmpSnoopTxquery.buildFrames({ enabled: true, version: "v2" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "IGMP snoop txquery on v2\n");

    expect(stdout).toBe("IGMP snoop txquery on v2\n");

    expect(ipIgmpSnoopTxquery.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
