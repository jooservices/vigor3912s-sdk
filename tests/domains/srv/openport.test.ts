import { describe, expect, it } from "vitest";

import { srvNatOpenport } from "../../../src/domains/srv.js";
import { parseOpenport } from "../../../src/internal/parsers/srv/openport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const VALID_INPUT = {
  ruleIndex: 1,
  subItem: 1,
  enabled: true,
  comment: "games",
  localIp: "192.168.1.55",
  wanIndex: 1,
  wanAliasIndex: 1,
  protocol: "TCP",
  startPort: 56,
  endPort: 83,
} as const;

describe("cli.srv.nat.openport -- srv nat openport <n> <m> -a -c -i -w -p -s -e", () => {
  it("builds the documented worked-example frame and rejects invalid input", () => {
    const frame = firstFrame(srvNatOpenport.buildFrames(VALID_INPUT));

    expect(frame.command).toBe(
      "srv nat openport 1 1 -a 1 -c games -i 192.168.1.55 -w 1 1 -p TCP -s 56 -e 83",
    );

    const disabledFrame = firstFrame(
      srvNatOpenport.buildFrames({ ...VALID_INPUT, enabled: false }),
    );

    expect(disabledFrame.command).toBe(
      "srv nat openport 1 1 -a 0 -c games -i 192.168.1.55 -w 1 1 -p TCP -s 56 -e 83",
    );

    expect(() => srvNatOpenport.buildFrames({ ...VALID_INPUT, ruleIndex: 261 })).toThrow(
      /ruleIndex/,
    );
    expect(() => srvNatOpenport.buildFrames({ ...VALID_INPUT, comment: "x".repeat(23) })).toThrow(
      /comment/,
    );
    expect(() => srvNatOpenport.buildFrames({ ...VALID_INPUT, localIp: "bad" })).toThrow(/localIp/);
    expect(() =>
      srvNatOpenport.buildFrames({
        ...VALID_INPUT,
        protocol: "SCTP" as unknown as "TCP",
      }),
    ).toThrow(/protocol/);
  });

  it("parses the documented worked-example acknowledgement text (synthetic sample)", () => {
    expect(parseOpenport(" Set WAN Port ok!!\n")).toEqual({ raw: "Set WAN Port ok!!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvNatOpenport, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvNatOpenport.buildFrames(VALID_INPUT)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, " Set WAN Port ok!!\n");

    expect(stdout).toBe(" Set WAN Port ok!!\n");
    expect(srvNatOpenport.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
