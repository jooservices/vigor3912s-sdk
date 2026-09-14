import { describe, expect, it } from "vitest";

import { apmCacheClear } from "../../../src/domains/apm.js";
import { parseCacheClear } from "../../../src/internal/parsers/apm/cache-clear.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.cache.clear -- apm cache clear", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmCacheClear.buildFrames(undefined));

    expect(frame.command).toBe("apm cache clear");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseCacheClear("% Cache cleared.\n")).toEqual({
      raw: "% Cache cleared.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(apmCacheClear, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmCacheClear.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Cache cleared.");

    expect(stdout).toBe("% Cache cleared.");
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseCacheClear", () => {
    expect(apmCacheClear.parse([exchange("% Cache cleared.")])).toEqual(
      parseCacheClear("% Cache cleared."),
    );
  });
});
