import { describe, expect, it } from "vitest";

import { srvDhcpFrcdnsmanl } from "../../../src/domains/srv.js";
import { parseFrcdnsmanl } from "../../../src/internal/parsers/srv/frcdnsmanl.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.frcdnsmanl", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpFrcdnsmanl.buildFrames({ enabled: true })).command).toBe(
      "srv dhcp frcdnsmanl on",
    );
    expect(firstFrame(srvDhcpFrcdnsmanl.buildFrames({ enabled: false })).command).toBe(
      "srv dhcp frcdnsmanl off",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseFrcdnsmanl(
        "% Domain name server now is using manual settings!\
",
      ),
    ).toEqual({ raw: "% Domain name server now is using manual settings!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpFrcdnsmanl, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpFrcdnsmanl.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Domain name server now is using manual settings!\
",
    );

    expect(stdout).toBe(
      "% Domain name server now is using manual settings!\
",
    );
    expect(srvDhcpFrcdnsmanl.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
