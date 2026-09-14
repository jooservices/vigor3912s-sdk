import { describe, expect, it } from "vitest";

import { srvDhcpPrimWins } from "../../../src/domains/srv.js";
import { parsePrimwins } from "../../../src/internal/parsers/srv/primwins.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.primwins", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(
      firstFrame(srvDhcpPrimWins.buildFrames({ action: "set", winsIp: "192.168.1.88" })).command,
    ).toBe("srv dhcp primWINS 192.168.1.88");
    expect(firstFrame(srvDhcpPrimWins.buildFrames({ action: "clear" })).command).toBe(
      "srv dhcp primWINS clear",
    );
    expect(() => srvDhcpPrimWins.buildFrames({ action: "set", winsIp: "bad" })).toThrow(/winsIp/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parsePrimwins(
        "% Now: 192.168.1.88\
",
      ),
    ).toEqual({ raw: "% Now: 192.168.1.88" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpPrimWins, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      srvDhcpPrimWins.buildFrames({ action: "set", winsIp: "192.168.1.88" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Now: 192.168.1.88\
",
    );

    expect(stdout).toBe(
      "% Now: 192.168.1.88\
",
    );
    expect(srvDhcpPrimWins.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
