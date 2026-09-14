import { describe, expect, it } from "vitest";

import { radiusAuthport } from "../../../src/domains/radius.js";
import { parseAuthport } from "../../../src/internal/parsers/radius/authport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.radius.authport -- radius authport <port> (write)", () => {
  it("builds the documented authport frame and rejects out-of-range ports", () => {
    expect(firstFrame(radiusAuthport.buildFrames({ port: 1812 })).command).toBe(
      "radius authport 1812",
    );

    expect(() => radiusAuthport.buildFrames({ port: -1 })).toThrow(/port/);
    expect(() => radiusAuthport.buildFrames({ port: 65536 })).toThrow(/port/);
    expect(() => radiusAuthport.buildFrames({ port: 1812.5 })).toThrow(/must be an integer/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseAuthport("% authport set to 1812\n")).toEqual({ raw: "% authport set to 1812" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(radiusAuthport, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(radiusAuthport.buildFrames({ port: 1812 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% authport set to 1812\n");

    expect(radiusAuthport.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% authport set to 1812",
    });

    await expectClosedTransportFailure(command);
  });
});
