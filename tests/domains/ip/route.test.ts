import { describe, expect, it } from "vitest";

import { ipRoute } from "../../../src/domains/ip.js";
import { parseRoute } from "../../../src/internal/parsers/ip/route.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.route -- ip route status (read-only query)", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipRoute.buildFrames(undefined)).command).toBe("ip route status");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseRoute("> ip route status\n")).toEqual({
      raw: "> ip route status",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipRoute, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipRoute.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "ok\n");

    expect(stdout).toBe("ok\n");

    expect(ipRoute.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
