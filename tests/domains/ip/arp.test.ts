import { describe, expect, it } from "vitest";

import { ipArp } from "../../../src/domains/ip.js";
import { parseArp } from "../../../src/internal/parsers/ip/arp.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.arp -- ip arp (read-only query variants)", () => {
  it("builds the documented frames per variant", () => {
    expect(firstFrame(ipArp.buildFrames({ action: "status" })).command).toBe("ip arp status");
    expect(firstFrame(ipArp.buildFrames({ action: "acceptStatus" })).command).toBe(
      "ip arp accept status",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseArp("[ARP Table]\n")).toEqual({ raw: "[ARP Table]" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipArp, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipArp.buildFrames({ action: "status" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "[ARP Table]\n");

    expect(stdout).toBe("[ARP Table]\n");

    expect(ipArp.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
