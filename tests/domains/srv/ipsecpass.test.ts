import { describe, expect, it } from "vitest";

import { srvNatIpsecpass } from "../../../src/domains/srv.js";
import { parseIpsecpass } from "../../../src/internal/parsers/srv/ipsecpass.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.nat.ipsecpass", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvNatIpsecpass.buildFrames({ action: "status" })).command).toBe(
      "srv nat ipsecpass status",
    );
    expect(firstFrame(srvNatIpsecpass.buildFrames({ action: "on" })).command).toBe(
      "srv nat ipsecpass on",
    );
    expect(firstFrame(srvNatIpsecpass.buildFrames({ action: "off" })).command).toBe(
      "srv nat ipsecpass off",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseIpsecpass(
        "%% Status: IPsec ESP pass-thru and IKE src_port:500 preservation is OFF.\
",
      ),
    ).toEqual({ raw: "%% Status: IPsec ESP pass-thru and IKE src_port:500 preservation is OFF." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvNatIpsecpass, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvNatIpsecpass.buildFrames({ action: "status" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "%% Status: IPsec ESP pass-thru and IKE src_port:500 preservation is OFF.\
",
    );

    expect(stdout).toBe(
      "%% Status: IPsec ESP pass-thru and IKE src_port:500 preservation is OFF.\
",
    );
    expect(srvNatIpsecpass.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
