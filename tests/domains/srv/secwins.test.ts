import { describe, expect, it } from "vitest";

import { srvDhcpSecWins } from "../../../src/domains/srv.js";
import { parseSecwins } from "../../../src/internal/parsers/srv/secwins.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.secwins", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(
      firstFrame(srvDhcpSecWins.buildFrames({ action: "set", winsIp: "192.168.1.180" })).command,
    ).toBe("srv dhcp secWINS 192.168.1.180");
    expect(firstFrame(srvDhcpSecWins.buildFrames({ action: "clear" })).command).toBe(
      "srv dhcp secWINS clear",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseSecwins(
        "% Now: 192.168.1.180\
",
      ),
    ).toEqual({ raw: "% Now: 192.168.1.180" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpSecWins, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      srvDhcpSecWins.buildFrames({ action: "set", winsIp: "192.168.1.180" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Now: 192.168.1.180\
",
    );

    expect(stdout).toBe(
      "% Now: 192.168.1.180\
",
    );
    expect(srvDhcpSecWins.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
