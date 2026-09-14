import { describe, expect, it } from "vitest";

import { srvNatDmz } from "../../../src/domains/srv.js";
import { parseDmz } from "../../../src/internal/parsers/srv/dmz.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.nat.dmz -- srv nat dmz <n> <m> -i|-e|-r|-v", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    const setIpFrame = firstFrame(
      srvNatDmz.buildFrames({
        action: "setPrivateIp",
        wan: 1,
        index: 1,
        privateIp: "192.168.1.96",
      }),
    );

    expect(setIpFrame.command).toBe("srv nat dmz 1 1 -i 192.168.1.96");

    const toggleFrame = firstFrame(
      srvNatDmz.buildFrames({ action: "toggle", wan: 1, index: 1, enabled: false }),
    );

    expect(toggleFrame.command).toBe("srv nat dmz 1 1 -e 0");

    const toggleOnFrame = firstFrame(
      srvNatDmz.buildFrames({ action: "toggle", wan: 1, index: 1, enabled: true }),
    );

    expect(toggleOnFrame.command).toBe("srv nat dmz 1 1 -e 1");

    const removeFrame = firstFrame(srvNatDmz.buildFrames({ action: "remove", wan: 2, index: 3 }));

    expect(removeFrame.command).toBe("srv nat dmz 2 3 -r");

    const viewFrame = firstFrame(srvNatDmz.buildFrames({ action: "view" }));

    expect(viewFrame.command).toBe("srv nat dmz -v");

    expect(() =>
      srvNatDmz.buildFrames({
        action: "setPrivateIp",
        wan: 3 as unknown as 1 | 2,
        index: 1,
        privateIp: "192.168.1.96",
      }),
    ).toThrow(/wan/);
    expect(() => srvNatDmz.buildFrames({ action: "remove", wan: 1, index: 301 })).toThrow(/index/);
    expect(() =>
      srvNatDmz.buildFrames({
        action: "setPrivateIp",
        wan: 1,
        index: 1,
        privateIp: "not-an-ip",
      }),
    ).toThrow(/privateIp/);
  });

  it("parses the documented status text (synthetic sample)", () => {
    expect(parseDmz("%      WAN1 DMZ mapping status:\n")).toEqual({
      raw: "%      WAN1 DMZ mapping status:",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvNatDmz, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      srvNatDmz.buildFrames({
        action: "setPrivateIp",
        wan: 1,
        index: 1,
        privateIp: "192.168.1.96",
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "%      WAN1 DMZ mapping status:\n",
    );

    expect(stdout).toBe("%      WAN1 DMZ mapping status:\n");
    expect(srvNatDmz.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
