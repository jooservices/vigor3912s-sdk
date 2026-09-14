import { describe, expect, it } from "vitest";

import { mngtIp6Iids } from "../../../src/domains/mngt.js";
import { parseIp6Iids } from "../../../src/internal/parsers/mngt/ip6-iids.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "% Setting success\n";

describe("cli.mngt.ip6iids", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(mngtIp6Iids.buildFrames({ action: "setMode", mode: 1 }));

    expect(frame.command).toBe("mngt ip6_IIDs -e 1");
    expect(() => mngtIp6Iids.buildFrames({ action: "setMode", mode: 2 as 0 })).toThrow(/mode/);
  });

  it("builds the documented frame for the regenerate action", () => {
    const frame = firstFrame(mngtIp6Iids.buildFrames({ action: "regenerate", iface: "wan1" }));

    expect(frame.command).toBe("mngt ip6_IIDs -r wan1");
    expect(() => mngtIp6Iids.buildFrames({ action: "regenerate", iface: "" })).toThrow(/iface/);
  });

  it("builds the documented frame for the show action", () => {
    const frame = firstFrame(mngtIp6Iids.buildFrames({ action: "show" }));

    expect(frame.command).toBe("mngt ip6_IIDs -s");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseIp6Iids(SAMPLE_TEXT)).toEqual({
      raw: "% Setting success",
    });
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(mngtIp6Iids.parse(exchanges(SAMPLE_TEXT))).toEqual(parseIp6Iids(SAMPLE_TEXT));
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(mngtIp6Iids, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(mngtIp6Iids.buildFrames({ action: "setMode", mode: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
