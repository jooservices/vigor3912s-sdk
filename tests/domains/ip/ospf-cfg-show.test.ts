import { describe, expect, it } from "vitest";

import { ipOspfCfgShow } from "../../../src/domains/ip.js";
import { parseOspfCfgShow } from "../../../src/internal/parsers/ip/ospf-cfg-show.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.ospf.cfg.show -- ip ospf cfg show", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipOspfCfgShow.buildFrames()).command).toBe("ip ospf cfg show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOspfCfgShow("OSPF: Enable\nIdx  State  Area_id\n")).toEqual({
      raw: "OSPF: Enable\nIdx  State  Area_id",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipOspfCfgShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipOspfCfgShow.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "OSPF: Enable\nIdx  State  Area_id\n",
    );

    expect(stdout).toBe("OSPF: Enable\nIdx  State  Area_id\n");

    expect(ipOspfCfgShow.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
