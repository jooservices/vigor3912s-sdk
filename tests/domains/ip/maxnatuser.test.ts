import { describe, expect, it } from "vitest";

import { ipMaxnatuser } from "../../../src/domains/ip.js";
import { parseMaxnatuser } from "../../../src/internal/parsers/ip/maxnatuser.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.maxnatuser -- ip maxnatuser", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipMaxnatuser.buildFrames({ userCount: 100 })).command).toBe(
      "ip maxnatuser 100",
    );
    expect(firstFrame(ipMaxnatuser.buildFrames({ userCount: 0 })).command).toBe("ip maxnatuser 0");

    expect(() => ipMaxnatuser.buildFrames({ userCount: -1 })).toThrow(/userCount/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMaxnatuser("% Max NAT user = 100\n")).toEqual({
      raw: "% Max NAT user = 100",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipMaxnatuser, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipMaxnatuser.buildFrames({ userCount: 100 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Max NAT user = 100\n");

    expect(stdout).toBe("% Max NAT user = 100\n");

    expect(ipMaxnatuser.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
