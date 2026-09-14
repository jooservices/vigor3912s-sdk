import { describe, expect, it } from "vitest";

import { vpnList } from "../../../src/domains/vpn.js";
import { parseList } from "../../../src/internal/parsers/vpn/list.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.list -- vpn list (bare, sibling-live-verified read query)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = vpnList.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vpn list");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(
      parseList("% Common Settings\n\n% Profile Name : ???\n% Profile Status : Disable\n"),
    ).toEqual({
      raw: "% Common Settings\n\n% Profile Name : ???\n% Profile Status : Disable",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vpnList, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnList.buildFrames(undefined));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% Profile Status : Disable\n",
    );

    expect(vpnList.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Profile Status : Disable" });

    await expectClosedTransportFailure(frame.command);
  });
});
