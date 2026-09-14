import { describe, expect, it } from "vitest";

import { radiusEnable } from "../../../src/domains/radius.js";
import { parseEnable } from "../../../src/internal/parsers/radius/enable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.radius.enable -- radius enable <0/1> (write)", () => {
  it("builds the documented enable/disable frames", () => {
    expect(firstFrame(radiusEnable.buildFrames({ enabled: true })).command).toBe("radius enable 1");
    expect(firstFrame(radiusEnable.buildFrames({ enabled: false })).command).toBe(
      "radius enable 0",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseEnable("% RADIUS server enabled\n")).toEqual({ raw: "% RADIUS server enabled" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(radiusEnable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(radiusEnable.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% RADIUS server enabled\n");

    expect(radiusEnable.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% RADIUS server enabled",
    });

    await expectClosedTransportFailure(command);
  });
});
