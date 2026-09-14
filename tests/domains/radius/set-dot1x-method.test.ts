import { describe, expect, it } from "vitest";

import { radiusSetDot1xMethod } from "../../../src/domains/radius.js";
import { parseSetDot1xMethod } from "../../../src/internal/parsers/radius/set-dot1x-method.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.radius.setdot1xmethod -- radius set_dot1x_method -e|-d (write)", () => {
  it("builds the documented enable/disable method frames and rejects invalid indexes", () => {
    expect(
      firstFrame(radiusSetDot1xMethod.buildFrames({ action: "enable", methodIndex: 1 })).command,
    ).toBe("radius set_dot1x_method -e 1");
    expect(
      firstFrame(radiusSetDot1xMethod.buildFrames({ action: "disable", methodIndex: 4 })).command,
    ).toBe("radius set_dot1x_method -d 4");

    expect(() =>
      radiusSetDot1xMethod.buildFrames({ action: "enable", methodIndex: 5 as never }),
    ).toThrow(/methodIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSetDot1xMethod("% dot1x method set\n")).toEqual({ raw: "% dot1x method set" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(radiusSetDot1xMethod, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      radiusSetDot1xMethod.buildFrames({ action: "enable", methodIndex: 1 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% dot1x method set\n");

    expect(radiusSetDot1xMethod.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% dot1x method set",
    });

    await expectClosedTransportFailure(command);
  });
});
