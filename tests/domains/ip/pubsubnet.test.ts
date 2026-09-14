import { describe, expect, it } from "vitest";

import { ipPubsubnet } from "../../../src/domains/ip.js";
import { parsePubsubnet } from "../../../src/internal/parsers/ip/pubsubnet.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.pubsubnet -- ip pubsubnet", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipPubsubnet.buildFrames({ enabled: true })).command).toBe(
      "ip pubsubnet enable",
    );
    expect(firstFrame(ipPubsubnet.buildFrames({ enabled: false })).command).toBe(
      "ip pubsubnet disable",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parsePubsubnet("public subnet enabled!\n")).toEqual({
      raw: "public subnet enabled!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipPubsubnet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipPubsubnet.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "public subnet enabled!\n");

    expect(stdout).toBe("public subnet enabled!\n");

    expect(ipPubsubnet.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
