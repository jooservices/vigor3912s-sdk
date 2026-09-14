import { describe, expect, it } from "vitest";

import { wolUp } from "../../../src/domains/wol.js";
import { parseUp } from "../../../src/internal/parsers/wol/up.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wol -- wol up <MAC Address> (write)", () => {
  it("builds the documented frame with a required MAC address and rejects invalid input", () => {
    const frame = firstFrame(wolUp.buildFrames({ macAddress: "00:11:22:33:44:55" }));

    expect(frame.command).toBe("wol up 00:11:22:33:44:55");

    expect(() => wolUp.buildFrames({ macAddress: "" })).toThrow(/macAddress/);
    expect(() => wolUp.buildFrames({ macAddress: "not-a-mac" })).toThrow(/macAddress/);
    expect(() => wolUp.buildFrames({ macAddress: "00-11-22-33-44-55" })).toThrow(/macAddress/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUp("% wol up: sent\n")).toEqual({ raw: "% wol up: sent" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wolUp, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(wolUp.buildFrames({ macAddress: "00:11:22:33:44:55" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% wol up: sent\n");

    expect(wolUp.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% wol up: sent" });

    await expectClosedTransportFailure(command);
  });
});
