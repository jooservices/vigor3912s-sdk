import { describe, expect, it } from "vitest";

import { ip6Session } from "../../../src/domains/ip6.js";
import { parseSession } from "../../../src/internal/parsers/ip6/session.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.session", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6Session.buildFrames({ action: "on" })).command).toBe("ip6 session on");
    expect(
      firstFrame(
        ip6Session.buildFrames({
          action: "add",
          ipStart: "2100:ABCD::2",
          ipEnd: "2100:ABCD::10",
          limit: 100,
        }),
      ).command,
    ).toBe("ip6 session add 2100:ABCD::2-2100:ABCD::10 100");
    expect(firstFrame(ip6Session.buildFrames({ action: "status" })).command).toBe(
      "ip6 session status",
    );
    expect(firstFrame(ip6Session.buildFrames({ action: "off" })).command).toBe("ip6 session off");
    expect(firstFrame(ip6Session.buildFrames({ action: "default", limit: 50 })).command).toBe(
      "ip6 session default 50",
    );
    expect(firstFrame(ip6Session.buildFrames({ action: "show" })).command).toBe("ip6 session show");
    expect(
      firstFrame(ip6Session.buildFrames({ action: "delete", ipStart: "2100:ABCD::2" })).command,
    ).toBe("ip6 session del 2100:ABCD::2");
    expect(firstFrame(ip6Session.buildFrames({ action: "deleteAll" })).command).toBe(
      "ip6 session del all",
    );
    expect(() => ip6Session.buildFrames({ action: "default", limit: 0 })).toThrow(/limit/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseSession(
        "Current ip6 session limit is turn on\
",
      ),
    ).toEqual({ raw: "Current ip6 session limit is turn on" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6Session, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Session.buildFrames({ action: "status" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Current ip6 session limit is turn on\
",
    );

    expect(ip6Session.parse([exchange(stdout)])).toEqual({
      raw: "Current ip6 session limit is turn on",
    });
    expect(command).toBe("ip6 session status");

    await expectClosedTransportFailure(command);
  });
});
