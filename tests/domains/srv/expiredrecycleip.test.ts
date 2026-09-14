import { describe, expect, it } from "vitest";

import { srvDhcpExpiredRecycleIp } from "../../../src/domains/srv.js";
import { parseExpiredrecycleip } from "../../../src/internal/parsers/srv/expiredrecycleip.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.expiredrecycleip", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpExpiredRecycleIp.buildFrames({ seconds: 250 })).command).toBe(
      "srv dhcp expRecycleIP 250",
    );
    expect(() => srvDhcpExpiredRecycleIp.buildFrames({ seconds: 4 })).toThrow(/seconds/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseExpiredrecycleip(
        "% DHCP expired_RecycleIP = 250\
",
      ),
    ).toEqual({ raw: "% DHCP expired_RecycleIP = 250" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpExpiredRecycleIp, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpExpiredRecycleIp.buildFrames({ seconds: 250 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% DHCP expired_RecycleIP = 250\
",
    );

    expect(stdout).toBe(
      "% DHCP expired_RecycleIP = 250\
",
    );
    expect(srvDhcpExpiredRecycleIp.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
