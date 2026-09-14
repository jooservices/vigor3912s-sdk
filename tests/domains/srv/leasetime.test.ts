import { describe, expect, it } from "vitest";

import { srvDhcpLeasetime } from "../../../src/domains/srv.js";
import { parseLeasetime } from "../../../src/internal/parsers/srv/leasetime.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.leasetime -- srv dhcp leasetime <Lease Time (sec)>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(srvDhcpLeasetime.buildFrames({ leaseTimeSeconds: 259_200 }));

    expect(frame.command).toBe("srv dhcp leasetime 259200");

    expect(() => srvDhcpLeasetime.buildFrames({ leaseTimeSeconds: 0 })).toThrow(/leaseTimeSeconds/);
    expect(() => srvDhcpLeasetime.buildFrames({ leaseTimeSeconds: -1 })).toThrow(
      /leaseTimeSeconds/,
    );
    expect(() => srvDhcpLeasetime.buildFrames({ leaseTimeSeconds: 1.5 })).toThrow(
      /leaseTimeSeconds/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseLeasetime("% Now: 259200\n")).toEqual({ raw: "% Now: 259200" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpLeasetime, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpLeasetime.buildFrames({ leaseTimeSeconds: 259_200 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Now: 259200\n");

    expect(stdout).toBe("% Now: 259200\n");
    expect(srvDhcpLeasetime.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
