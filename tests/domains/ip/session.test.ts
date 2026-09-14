import { describe, expect, it } from "vitest";

import { ipSession } from "../../../src/domains/ip.js";
import { parseSession } from "../../../src/internal/parsers/ip/session.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.session -- ip session (read-only query variants)", () => {
  it("builds the documented frames per variant", () => {
    expect(firstFrame(ipSession.buildFrames({ action: "status" })).command).toBe(
      "ip session status",
    );
    expect(firstFrame(ipSession.buildFrames({ action: "show" })).command).toBe("ip session show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSession("Current ip session limit is turn on\n")).toEqual({
      raw: "Current ip session limit is turn on",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipSession, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipSession.buildFrames({ action: "status" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "ok\n");

    expect(stdout).toBe("ok\n");

    expect(ipSession.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
