import { describe, expect, it } from "vitest";

import { ipOspfDis } from "../../../src/domains/ip.js";
import { parseOspfDis } from "../../../src/internal/parsers/ip/ospf-dis.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.ospf.dis -- ip ospf dis", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipOspfDis.buildFrames()).command).toBe("ip ospf dis");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOspfDis("OSPF disabled\n")).toEqual({
      raw: "OSPF disabled",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipOspfDis, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipOspfDis.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OSPF disabled\n");

    expect(stdout).toBe("OSPF disabled\n");

    expect(ipOspfDis.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
