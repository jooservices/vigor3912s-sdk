import { describe, expect, it } from "vitest";

import { ipOspfNbr } from "../../../src/domains/ip.js";
import { parseOspfNbr } from "../../../src/internal/parsers/ip/ospf-nbr.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.ospf.nbr -- ip ospf nbr", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipOspfNbr.buildFrames()).command).toBe("ip ospf nbr");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOspfNbr("OSPF neighbors\n")).toEqual({
      raw: "OSPF neighbors",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipOspfNbr, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipOspfNbr.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OSPF neighbors\n");

    expect(stdout).toBe("OSPF neighbors\n");

    expect(ipOspfNbr.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
