import { describe, expect, it } from "vitest";

import { apmProfileDel } from "../../../src/domains/apm.js";
import { parseProfileDel } from "../../../src/internal/parsers/apm/profile-del.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.profile.del -- apm profile del <index>", () => {
  it("builds the documented frame and rejects non-positive input", () => {
    const frame = firstFrame(apmProfileDel.buildFrames({ index: 3 }));

    expect(frame.command).toBe("apm profile del 3");
    expect(() => apmProfileDel.buildFrames({ index: 0 })).toThrow(/index/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseProfileDel("% Profile deleted.\n")).toEqual({ raw: "% Profile deleted." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(apmProfileDel, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmProfileDel.buildFrames({ index: 3 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Profile deleted.");

    expect(stdout).toBe("% Profile deleted.");
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseProfileDel", () => {
    expect(apmProfileDel.parse([exchange("% Profile deleted.")])).toEqual(
      parseProfileDel("% Profile deleted."),
    );
  });
});
