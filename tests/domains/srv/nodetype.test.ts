import { describe, expect, it } from "vitest";

import { srvDhcpNodetype } from "../../../src/domains/srv.js";
import { parseNodetype } from "../../../src/internal/parsers/srv/nodetype.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.nodetype", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpNodetype.buildFrames({ nodeType: 1 })).command).toBe(
      "srv dhcp nodetype 1",
    );
    expect(() => srvDhcpNodetype.buildFrames({ nodeType: 3 as 1 })).toThrow(/nodeType/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseNodetype(
        "% Now: 1\
",
      ),
    ).toEqual({ raw: "% Now: 1" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpNodetype, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpNodetype.buildFrames({ nodeType: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Now: 1\
",
    );

    expect(stdout).toBe(
      "% Now: 1\
",
    );
    expect(srvDhcpNodetype.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
