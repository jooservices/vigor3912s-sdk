import { describe, expect, it } from "vitest";

import { srvDhcpOff } from "../../../src/domains/srv.js";
import { parseOff } from "../../../src/internal/parsers/srv/off.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.off -- srv dhcp off", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(srvDhcpOff.buildFrames(undefined));

    expect(frame.command).toBe("srv dhcp off");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOff("% DHCP server is now off.\n")).toEqual({ raw: "% DHCP server is now off." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpOff, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpOff.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% DHCP server is now off.\n");

    expect(stdout).toBe("% DHCP server is now off.\n");
    expect(srvDhcpOff.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
