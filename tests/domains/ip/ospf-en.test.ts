import { describe, expect, it } from "vitest";

import { ipOspfEn } from "../../../src/domains/ip.js";
import { parseOspfEn } from "../../../src/internal/parsers/ip/ospf-en.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.ospf.en -- ip ospf en", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipOspfEn.buildFrames()).command).toBe("ip ospf en");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOspfEn("OSPF enabled\n")).toEqual({
      raw: "OSPF enabled",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipOspfEn, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipOspfEn.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OSPF enabled\n");

    expect(stdout).toBe("OSPF enabled\n");

    expect(ipOspfEn.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
