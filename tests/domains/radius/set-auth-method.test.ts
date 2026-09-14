import { describe, expect, it } from "vitest";

import { radiusSetAuthMethod } from "../../../src/domains/radius.js";
import { parseSetAuthMethod } from "../../../src/internal/parsers/radius/set-auth-method.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.radius.setauthmethod -- radius set_auth_method <0/1> (write)", () => {
  it("builds the documented method frame and rejects invalid indexes", () => {
    expect(firstFrame(radiusSetAuthMethod.buildFrames({ methodIndex: 1 })).command).toBe(
      "radius set_auth_method 1",
    );

    expect(() => radiusSetAuthMethod.buildFrames({ methodIndex: 2 as never })).toThrow(
      /methodIndex/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSetAuthMethod("% auth method set\n")).toEqual({ raw: "% auth method set" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(radiusSetAuthMethod, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(radiusSetAuthMethod.buildFrames({ methodIndex: 0 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% auth method set\n");

    expect(radiusSetAuthMethod.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% auth method set",
    });

    await expectClosedTransportFailure(command);
  });
});
