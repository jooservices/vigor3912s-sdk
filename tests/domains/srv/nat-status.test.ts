import { describe, expect, it } from "vitest";

import { srvNatStatus } from "../../../src/domains/srv.js";
import { parseNatStatus } from "../../../src/internal/parsers/srv/nat-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.nat.status", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvNatStatus.buildFrames(undefined)).command).toBe("srv nat status");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseNatStatus(
        "NAT Port Redirection Running Table:\
\
Index  Protocol  Public Port\
",
      ),
    ).toEqual({
      raw: "NAT Port Redirection Running Table:\
\
Index  Protocol  Public Port",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(srvNatStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvNatStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "NAT Port Redirection Running Table:\
\
Index  Protocol  Public Port\
",
    );

    expect(stdout).toBe(
      "NAT Port Redirection Running Table:\
\
Index  Protocol  Public Port\
",
    );
    expect(srvNatStatus.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
