import { describe, expect, it } from "vitest";

import { radiusEnableDot1x } from "../../../src/domains/radius.js";
import { parseEnableDot1x } from "../../../src/internal/parsers/radius/enable-dot1x.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.radius.enabledot1x -- radius enable_dot1x <0/1> (write)", () => {
  it("builds the documented enable_dot1x frames", () => {
    expect(firstFrame(radiusEnableDot1x.buildFrames({ enabled: true })).command).toBe(
      "radius enable_dot1x 1",
    );
    expect(firstFrame(radiusEnableDot1x.buildFrames({ enabled: false })).command).toBe(
      "radius enable_dot1x 0",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseEnableDot1x("% dot1x enabled\n")).toEqual({ raw: "% dot1x enabled" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(radiusEnableDot1x, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(radiusEnableDot1x.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% dot1x enabled\n");

    expect(radiusEnableDot1x.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% dot1x enabled" });

    await expectClosedTransportFailure(command);
  });
});
