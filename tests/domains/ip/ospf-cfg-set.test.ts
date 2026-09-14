import { describe, expect, it } from "vitest";

import { ipOspfCfgSet } from "../../../src/domains/ip.js";
import { parseOspfCfgSet } from "../../../src/internal/parsers/ip/ospf-cfg-set.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.ospf.cfg.set -- ip ospf cfg set", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(
      firstFrame(ipOspfCfgSet.buildFrames({ action: "state", idx: 1, enabled: true })).command,
    ).toBe("ip ospf cfg set 1 state en");
    expect(
      firstFrame(ipOspfCfgSet.buildFrames({ action: "state", idx: 1, enabled: false })).command,
    ).toBe("ip ospf cfg set 1 state dis");
    expect(
      firstFrame(ipOspfCfgSet.buildFrames({ action: "area", idx: 1, areaId: 100 })).command,
    ).toBe("ip ospf cfg set 1 area 100");
    expect(
      firstFrame(ipOspfCfgSet.buildFrames({ action: "lan", idx: 1, lanNumber: 2 })).command,
    ).toBe("ip ospf cfg set 1 lan 2");
    expect(
      firstFrame(ipOspfCfgSet.buildFrames({ action: "wan", idx: 1, wanNumber: 1 })).command,
    ).toBe("ip ospf cfg set 1 wan 1");

    expect(() => ipOspfCfgSet.buildFrames({ action: "wan", idx: 1, wanNumber: 3 })).toThrow(
      /wanNumber/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOspfCfgSet("OSPF cfg updated\n")).toEqual({
      raw: "OSPF cfg updated",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipOspfCfgSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      ipOspfCfgSet.buildFrames({ action: "state", idx: 1, enabled: true }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OSPF cfg updated\n");

    expect(stdout).toBe("OSPF cfg updated\n");

    expect(ipOspfCfgSet.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
