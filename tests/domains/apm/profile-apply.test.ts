import { describe, expect, it } from "vitest";

import { apmProfileApply } from "../../../src/domains/apm.js";
import { parseProfileApply } from "../../../src/internal/parsers/apm/profile-apply.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.profile.apply -- apm profile apply <profile> <clients...>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      apmProfileApply.buildFrames({
        profileIndex: 2,
        clientIndexes: [1, 2, 3, 4, 5],
      }),
    );

    expect(frame.command).toBe("apm profile apply 2 1 2 3 4 5");
    expect(() =>
      apmProfileApply.buildFrames({
        profileIndex: 0,
        clientIndexes: [1, 2, 3, 4, 5],
      }),
    ).toThrow(/profileIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseProfileApply("% Applied.\n")).toEqual({ raw: "% Applied." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(apmProfileApply, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      apmProfileApply.buildFrames({
        profileIndex: 2,
        clientIndexes: [1, 2, 3, 4, 5],
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Applied.");

    expect(stdout).toBe("% Applied.");
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseProfileApply", () => {
    expect(apmProfileApply.parse([exchange("% Applied.")])).toEqual(
      parseProfileApply("% Applied."),
    );
  });
});
