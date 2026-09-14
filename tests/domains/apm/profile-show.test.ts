import { describe, expect, it } from "vitest";

import { apmProfileShow } from "../../../src/domains/apm.js";
import { parseProfileShow } from "../../../src/internal/parsers/apm/profile-show.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.profile.show -- apm profile show <index>", () => {
  it("builds the documented frame and rejects non-positive input", () => {
    const frame = firstFrame(apmProfileShow.buildFrames({ index: 2 }));

    expect(frame.command).toBe("apm profile show 2");
    expect(() => apmProfileShow.buildFrames({ index: 0 })).toThrow(/index/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseProfileShow("% Profile 2 details\n")).toEqual({ raw: "% Profile 2 details" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(apmProfileShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmProfileShow.buildFrames({ index: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Profile 2 details");

    expect(stdout).toBe("% Profile 2 details");
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseProfileShow", () => {
    expect(apmProfileShow.parse([exchange("% Profile 2 details")])).toEqual(
      parseProfileShow("% Profile 2 details"),
    );
  });
});
