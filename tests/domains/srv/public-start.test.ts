import { describe, expect, it } from "vitest";

import { srvDhcpPublicStart } from "../../../src/domains/srv.js";
import { parsePublicStart } from "../../../src/internal/parsers/srv/public-start.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.public.start", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpPublicStart.buildFrames({ startIp: "192.168.2.10" })).command).toBe(
      "srv dhcp public start 192.168.2.10",
    );
    expect(() => srvDhcpPublicStart.buildFrames({ startIp: "bad" })).toThrow(/startIp/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parsePublicStart(
        "% public start set\
",
      ),
    ).toEqual({ raw: "% public start set" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpPublicStart, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpPublicStart.buildFrames({ startIp: "192.168.2.10" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% public start set\
",
    );

    expect(stdout).toBe(
      "% public start set\
",
    );
    expect(srvDhcpPublicStart.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
