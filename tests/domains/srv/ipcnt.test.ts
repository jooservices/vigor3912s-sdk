import { describe, expect, it } from "vitest";

import { srvDhcpIpcnt } from "../../../src/domains/srv.js";
import { parseIpcnt } from "../../../src/internal/parsers/srv/ipcnt.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.ipcnt", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpIpcnt.buildFrames({ count: 150 })).command).toBe("srv dhcp ipcnt 150");
    expect(() => srvDhcpIpcnt.buildFrames({ count: 257 })).toThrow(/count/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseIpcnt(
        "% Now: 150\
",
      ),
    ).toEqual({ raw: "% Now: 150" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpIpcnt, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpIpcnt.buildFrames({ count: 150 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Now: 150\
",
    );

    expect(stdout).toBe(
      "% Now: 150\
",
    );
    expect(srvDhcpIpcnt.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
