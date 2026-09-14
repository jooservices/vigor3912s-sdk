import { describe, expect, it } from "vitest";

import { srvDhcpPublicStatus } from "../../../src/domains/srv.js";
import { parsePublicStatus } from "../../../src/internal/parsers/srv/public-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.public.status", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpPublicStatus.buildFrames(undefined)).command).toBe(
      "srv dhcp public status",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parsePublicStatus(
        "Index   MAC Address\
0.      14-49-BC-0D-1F-48 !!!\
",
      ),
    ).toEqual({
      raw: "Index   MAC Address\
0.      14-49-BC-0D-1F-48 !!!",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(srvDhcpPublicStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpPublicStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Index   MAC Address\
0.      14-49-BC-0D-1F-48 !!!\
",
    );

    expect(stdout).toBe(
      "Index   MAC Address\
0.      14-49-BC-0D-1F-48 !!!\
",
    );
    expect(srvDhcpPublicStatus.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
