import { describe, expect, it } from "vitest";

import { apmProfileSummary } from "../../../src/domains/apm.js";
import { parseProfileSummary } from "../../../src/internal/parsers/apm/profile-summary.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.profile.summary -- apm profile summary", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmProfileSummary.buildFrames(undefined));

    expect(frame.command).toBe("apm profile summary");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseProfileSummary("# Name             SSID\n0 Default        DrayTek-LAN-A\n"),
    ).toEqual({
      raw: "# Name             SSID\n0 Default        DrayTek-LAN-A",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(apmProfileSummary, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmProfileSummary.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "# Name             SSID\n0 Default        DrayTek-LAN-A",
    );

    expect(stdout).toBe("# Name             SSID\n0 Default        DrayTek-LAN-A");
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseProfileSummary", () => {
    expect(
      apmProfileSummary.parse([
        exchange("# Name             SSID\n0 Default        DrayTek-LAN-A"),
      ]),
    ).toEqual(parseProfileSummary("# Name             SSID\n0 Default        DrayTek-LAN-A"));
  });
});
