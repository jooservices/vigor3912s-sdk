import { describe, expect, it } from "vitest";

import { apmCacheShow } from "../../../src/domains/apm.js";
import { parseCacheShow } from "../../../src/internal/parsers/apm/cache-show.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.cache.show -- apm cache show", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmCacheShow.buildFrames(undefined));

    expect(frame.command).toBe("apm cache show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseCacheShow("MAC            Name\n00507FF17EE5 VigorAP903\n")).toEqual({
      raw: "MAC            Name\n00507FF17EE5 VigorAP903",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(apmCacheShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmCacheShow.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "MAC            Name\n00507FF17EE5 VigorAP903",
    );

    expect(stdout).toBe("MAC            Name\n00507FF17EE5 VigorAP903");
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseCacheShow", () => {
    expect(apmCacheShow.parse([exchange("MAC            Name\n00507FF17EE5 VigorAP903")])).toEqual(
      parseCacheShow("MAC            Name\n00507FF17EE5 VigorAP903"),
    );
  });
});
