import { describe, expect, it } from "vitest";

import { srvDhcpOn } from "../../../src/domains/srv.js";
import { parseOn } from "../../../src/internal/parsers/srv/on.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.on -- srv dhcp on (requires sys reboot to apply, per operations.md)", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(srvDhcpOn.buildFrames(undefined));

    expect(frame.command).toBe("srv dhcp on");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOn("% DHCP server is now on.\n")).toEqual({ raw: "% DHCP server is now on." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpOn, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpOn.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% DHCP server is now on.\n");

    expect(stdout).toBe("% DHCP server is now on.\n");
    expect(srvDhcpOn.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
