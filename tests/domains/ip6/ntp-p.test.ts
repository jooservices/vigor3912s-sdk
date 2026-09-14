import { describe, expect, it } from "vitest";

import { ip6NtpP } from "../../../src/domains/ip6.js";
import { parseNtpP } from "../../../src/internal/parsers/ip6/ntp-p.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.ntp.p", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6NtpP.buildFrames({ priority: 1 })).command).toBe("ip6 ntp -p 1");
    expect(() => ip6NtpP.buildFrames({ priority: 2 as 0 })).toThrow(/priority/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseNtpP(
        "% Set NTP Priority: IPv6 First\
",
      ),
    ).toEqual({ raw: "% Set NTP Priority: IPv6 First" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6NtpP, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6NtpP.buildFrames({ priority: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set NTP Priority: IPv6 First\
",
    );

    expect(ip6NtpP.parse([exchange(stdout)])).toEqual({ raw: "% Set NTP Priority: IPv6 First" });
    expect(command).toBe("ip6 ntp -p 1");

    await expectClosedTransportFailure(command);
  });
});
