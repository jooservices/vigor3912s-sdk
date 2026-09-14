import { describe, expect, it } from "vitest";

import { radiusExternalLog } from "../../../src/domains/radius.js";
import { parseExternalLog } from "../../../src/internal/parsers/radius/external-log.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.radius.external.log -- radius external -l <index> (read)", () => {
  it("builds the documented log frame and rejects invalid indexes", () => {
    expect(firstFrame(radiusExternalLog.buildFrames({ profileIndex: 2 })).command).toBe(
      "radius external -l 2",
    );

    expect(() => radiusExternalLog.buildFrames({ profileIndex: 0 })).toThrow(/profileIndex/);
  });

  it("parses the documented log text (synthetic sample)", () => {
    expect(parseExternalLog("% server status log\n")).toEqual({ raw: "% server status log" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(radiusExternalLog, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(radiusExternalLog.buildFrames({ profileIndex: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% server status log\n");

    expect(radiusExternalLog.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% server status log",
    });

    await expectClosedTransportFailure(command);
  });
});
