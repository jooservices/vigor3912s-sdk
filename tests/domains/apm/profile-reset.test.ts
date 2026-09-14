import { describe, expect, it } from "vitest";

import { apmProfileReset } from "../../../src/domains/apm.js";
import { parseProfileReset } from "../../../src/internal/parsers/apm/profile-reset.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.profile.reset -- apm profile reset", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmProfileReset.buildFrames(undefined));

    expect(frame.command).toBe("apm profile reset");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseProfileReset("(Done)\n")).toEqual({
      raw: "(Done)",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(apmProfileReset, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmProfileReset.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "(Done)");

    expect(stdout).toBe("(Done)");
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseProfileReset", () => {
    expect(apmProfileReset.parse([exchange("(Done)")])).toEqual(parseProfileReset("(Done)"));
  });
});
