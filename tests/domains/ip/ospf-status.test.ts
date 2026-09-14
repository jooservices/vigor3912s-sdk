import { describe, expect, it } from "vitest";

import { ipOspfStatus } from "../../../src/domains/ip.js";
import { parseOspfStatus } from "../../../src/internal/parsers/ip/ospf-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.ospf.status -- ip ospf status", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipOspfStatus.buildFrames()).command).toBe("ip ospf status");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOspfStatus("OSPF: Enable\n")).toEqual({
      raw: "OSPF: Enable",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipOspfStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipOspfStatus.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OSPF: Enable\n");

    expect(stdout).toBe("OSPF: Enable\n");

    expect(ipOspfStatus.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
