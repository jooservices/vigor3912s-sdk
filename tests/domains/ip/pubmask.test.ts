import { describe, expect, it } from "vitest";

import { ipPubmask } from "../../../src/domains/ip.js";
import { parsePubmask } from "../../../src/internal/parsers/ip/pubmask.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.pubmask -- ip pubmask", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipPubmask.buildFrames({ netmask: "255.255.0.0" })).command).toBe(
      "ip pubmask 255.255.0.0",
    );

    expect(() => ipPubmask.buildFrames({ netmask: "not-a-mask" })).toThrow(/netmask/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parsePubmask("% Set public subnet mask done !!!\n")).toEqual({
      raw: "% Set public subnet mask done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipPubmask, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipPubmask.buildFrames({ netmask: "255.255.0.0" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set public subnet mask done !!!\n",
    );

    expect(stdout).toBe("% Set public subnet mask done !!!\n");

    expect(ipPubmask.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
