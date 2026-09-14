import { describe, expect, it } from "vitest";

import { srvDhcpTftp } from "../../../src/domains/srv.js";
import { parseTftp } from "../../../src/internal/parsers/srv/tftp.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.tftp", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpTftp.buildFrames({ serverName: "TF123" })).command).toBe(
      "srv dhcp tftp TF123",
    );
    expect(() => srvDhcpTftp.buildFrames({ serverName: " " })).toThrow(/serverName/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseTftp(
        "% Now: TF123\
",
      ),
    ).toEqual({ raw: "% Now: TF123" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpTftp, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpTftp.buildFrames({ serverName: "TF123" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Now: TF123\
",
    );

    expect(stdout).toBe(
      "% Now: TF123\
",
    );
    expect(srvDhcpTftp.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
