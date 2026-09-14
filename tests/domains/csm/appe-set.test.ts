import { describe, expect, it } from "vitest";

import { csmAppeSet } from "../../../src/domains/csm.js";
import { parseAppeSet } from "../../../src/internal/parsers/csm/appe-set.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

describe("cli.csm.appe.set -- csm appe set -i INDEX ...", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    expect(
      firstFrame(csmAppeSet.buildFrames({ index: 1, action: "view", group: "IM" })).command,
    ).toBe("csm appe set -i 1 -v IM");
    expect(
      firstFrame(csmAppeSet.buildFrames({ index: 1, action: "enable", appIndex: 1 })).command,
    ).toBe("csm appe set -i 1 -e 1");
    expect(
      firstFrame(csmAppeSet.buildFrames({ index: 1, action: "disable", appIndex: 2 })).command,
    ).toBe("csm appe set -i 1 -d 2");
    expect(
      firstFrame(csmAppeSet.buildFrames({ index: 1, action: "enableRoute", appIndex: 3 })).command,
    ).toBe("csm appe set -i 1 -p 3");
    expect(
      firstFrame(csmAppeSet.buildFrames({ index: 1, action: "disableRoute", appIndex: 4 })).command,
    ).toBe("csm appe set -i 1 -q 4");

    expect(() => csmAppeSet.buildFrames({ index: 0, action: "enable", appIndex: 1 })).toThrow(
      /index/,
    );
    expect(() => csmAppeSet.buildFrames({ index: 33, action: "enable", appIndex: 1 })).toThrow(
      /index/,
    );
    expect(() =>
      csmAppeSet.buildFrames({ index: 1, action: "view", group: "Bogus" as never }),
    ).toThrow(/group/);
    expect(() => csmAppeSet.buildFrames({ index: 1, action: "enable", appIndex: 0 })).toThrow(
      /appIndex/,
    );
    expect(() => csmAppeSet.buildFrames({ index: 1.5, action: "enable", appIndex: 1 })).toThrow(
      /integer/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseAppeSet("Profile 1 - games: AliWW is enabled.\n")).toEqual({
      raw: "Profile 1 - games: AliWW is enabled.",
    });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(csmAppeSet.parse([exchange("Profile 1 - games: AliWW is enabled.\n")])).toEqual(
      parseAppeSet("Profile 1 - games: AliWW is enabled.\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(csmAppeSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      csmAppeSet.buildFrames({ index: 1, action: "enable", appIndex: 1 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Profile 1 - games: AliWW is enabled.",
    );

    expect(stdout).toBe("Profile 1 - games: AliWW is enabled.");
    await expectClosedTransportFailure(command);
  });
});
