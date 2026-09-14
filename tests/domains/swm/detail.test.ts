import { describe, expect, it } from "vitest";

import { swmDetail } from "../../../src/domains/swm.js";
import { parseSwmDetail } from "../../../src/internal/parsers/swm/detail.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const MAC = "001DAA0CCD08";

describe("cli.swm.detail -- swm detail comment/name/passwd/config/show/port/rate", () => {
  it("builds the documented frame for every variant and rejects invalid input", () => {
    expect(
      firstFrame(
        swmDetail.buildFrames({ action: "comment", mac: MAC, comment: "availablefor2floor" }),
      ).command,
    ).toBe(`swm detail comment ${MAC} availablefor2floor`);

    expect(
      firstFrame(swmDetail.buildFrames({ action: "name", mac: MAC, name: "G2280" })).command,
    ).toBe(`swm detail name ${MAC} G2280`);

    expect(
      firstFrame(swmDetail.buildFrames({ action: "passwd", mac: MAC, password: "secret1" }))
        .command,
    ).toBe(`swm detail passwd ${MAC} secret1`);

    expect(
      firstFrame(swmDetail.buildFrames({ action: "config", mac: MAC, configIndex: 1 })).command,
    ).toBe(`swm detail config ${MAC} 1`);

    expect(firstFrame(swmDetail.buildFrames({ action: "show" })).command).toBe("swm detail show");

    expect(firstFrame(swmDetail.buildFrames({ action: "portShow", mac: MAC })).command).toBe(
      `swm detail port show ${MAC}`,
    );

    expect(
      firstFrame(
        swmDetail.buildFrames({
          action: "port",
          mac: MAC,
          port: 1,
          flag: "on",
          schedule1: 0,
          schedule2: 0,
          description: "lobby",
        }),
      ).command,
    ).toBe(`swm detail port ${MAC} 1 on 0 0 lobby`);

    expect(
      firstFrame(
        swmDetail.buildFrames({
          action: "rateToggle",
          mac: MAC,
          port: 1,
          direction: "i",
          enabled: true,
        }),
      ).command,
    ).toBe(`swm detail rate ${MAC} 1 i e`);

    expect(
      firstFrame(
        swmDetail.buildFrames({
          action: "rateToggle",
          mac: MAC,
          port: 1,
          direction: "i",
          enabled: false,
        }),
      ).command,
    ).toBe(`swm detail rate ${MAC} 1 i d`);

    expect(
      firstFrame(
        swmDetail.buildFrames({
          action: "rateLimit",
          mac: MAC,
          port: 1,
          direction: "i",
          limit: 5000,
        }),
      ).command,
    ).toBe(`swm detail rate ${MAC} 1 i 5000`);

    expect(() =>
      swmDetail.buildFrames({
        action: "port",
        mac: MAC,
        port: 29,
        flag: "on",
        schedule1: 0,
        schedule2: 0,
        description: "x",
      }),
    ).toThrow(/port/);

    expect(() => swmDetail.buildFrames({ action: "config", mac: MAC, configIndex: -1 })).toThrow(
      /configIndex must not be negative/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmDetail("> swm detail show\n")).toEqual({ raw: "> swm detail show" });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmDetail.parse([exchange("> swm detail show\n")])).toEqual(
      parseSwmDetail("> swm detail show\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmDetail, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmDetail.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
