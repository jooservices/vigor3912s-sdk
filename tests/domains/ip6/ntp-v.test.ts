import { describe, expect, it } from "vitest";

import { ip6NtpV } from "../../../src/domains/ip6.js";
import { parseNtpV } from "../../../src/internal/parsers/ip6/ntp-v.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.ntp.v", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6NtpV.buildFrames(undefined)).command).toBe("ip6 ntp -v");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseNtpV(
        "% NTP state: enabled\
",
      ),
    ).toEqual({ raw: "% NTP state: enabled" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ip6NtpV, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6NtpV.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% NTP state: enabled\
",
    );

    expect(ip6NtpV.parse([exchange(stdout)])).toEqual({ raw: "% NTP state: enabled" });
    expect(command).toBe("ip6 ntp -v");

    await expectClosedTransportFailure(command);
  });
});
