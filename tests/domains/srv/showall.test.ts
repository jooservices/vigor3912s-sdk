import { describe, expect, it } from "vitest";

import { srvNatShowall } from "../../../src/domains/srv.js";
import { parseShowall } from "../../../src/internal/parsers/srv/showall.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.nat.showall", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvNatShowall.buildFrames(undefined)).command).toBe("srv nat showall");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseShowall(
        "Index   Proto   WAN IP:Port\
R01     TCP     0.0.0.0:25600\
",
      ),
    ).toEqual({
      raw: "Index   Proto   WAN IP:Port\
R01     TCP     0.0.0.0:25600",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(srvNatShowall, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvNatShowall.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Index   Proto   WAN IP:Port\
R01     TCP     0.0.0.0:25600\
",
    );

    expect(stdout).toBe(
      "Index   Proto   WAN IP:Port\
R01     TCP     0.0.0.0:25600\
",
    );
    expect(srvNatShowall.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
