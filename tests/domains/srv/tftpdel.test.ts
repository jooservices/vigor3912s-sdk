import { describe, expect, it } from "vitest";

import { srvDhcpTftpdel } from "../../../src/domains/srv.js";
import { parseTftpdel } from "../../../src/internal/parsers/srv/tftpdel.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.tftpdel", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpTftpdel.buildFrames(undefined)).command).toBe("srv dhcp tftpdel");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseTftpdel(
        "% The TFTP Server Name had been deleted !!!\
",
      ),
    ).toEqual({ raw: "% The TFTP Server Name had been deleted !!!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpTftpdel, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpTftpdel.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% The TFTP Server Name had been deleted !!!\
",
    );

    expect(stdout).toBe(
      "% The TFTP Server Name had been deleted !!!\
",
    );
    expect(srvDhcpTftpdel.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
