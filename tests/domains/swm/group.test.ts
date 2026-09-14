import { describe, expect, it } from "vitest";

import { swmGroup } from "../../../src/domains/swm.js";
import { parseSwmGroup } from "../../../src/internal/parsers/swm/group.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.group -- swm group set/show/add/delete", () => {
  it("builds the documented frame for every variant and rejects invalid input", () => {
    expect(
      firstFrame(
        swmGroup.buildFrames({
          action: "setWithPassword",
          idx: 10,
          name: "peace",
          password: "jpsword",
        }),
      ).command,
    ).toBe("swm group set 10 peace 1 jpsword");

    expect(
      firstFrame(swmGroup.buildFrames({ action: "setNoPassword", idx: 2, name: "guest" })).command,
    ).toBe("swm group set 2 guest 0");

    expect(firstFrame(swmGroup.buildFrames({ action: "show" })).command).toBe("swm group show");

    expect(
      firstFrame(swmGroup.buildFrames({ action: "add", idx: 1, mac: "001DAA0CCD08" })).command,
    ).toBe("swm group add 1 001DAA0CCD08");

    expect(
      firstFrame(swmGroup.buildFrames({ action: "delete", idx: 1, mac: "001DAA0CCD08" })).command,
    ).toBe("swm group delete 1 001DAA0CCD08");

    expect(() => swmGroup.buildFrames({ action: "add", idx: 11, mac: "001DAA0CCD08" })).toThrow(
      /idx/,
    );
    expect(() =>
      swmGroup.buildFrames({ action: "setNoPassword", idx: 1, name: "has space" }),
    ).toThrow(/whitespace/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmGroup("> swm group show\n")).toEqual({ raw: "> swm group show" });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmGroup.parse([exchange("> swm group show\n")])).toEqual(
      parseSwmGroup("> swm group show\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmGroup, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmGroup.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
