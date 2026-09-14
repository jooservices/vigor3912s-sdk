import { describe, expect, it } from "vitest";

import { swmLog } from "../../../src/domains/swm.js";
import { parseSwmLog } from "../../../src/internal/parsers/swm/log.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.log -- swm log show/set", () => {
  it("builds the documented frame for every variant and rejects invalid input", () => {
    expect(firstFrame(swmLog.buildFrames({ action: "showFilter" })).command).toBe(
      "swm log show filter",
    );
    expect(firstFrame(swmLog.buildFrames({ action: "showDay" })).command).toBe("swm log show day");
    expect(firstFrame(swmLog.buildFrames({ action: "showWeek" })).command).toBe(
      "swm log show week",
    );
    expect(
      firstFrame(swmLog.buildFrames({ action: "setLevel", idx: 8, enabled: true })).command,
    ).toBe("swm log set level 8 on");
    expect(
      firstFrame(swmLog.buildFrames({ action: "setLevel", idx: 8, enabled: false })).command,
    ).toBe("swm log set level 8 off");
    expect(
      firstFrame(swmLog.buildFrames({ action: "setType", idx: 1, enabled: false })).command,
    ).toBe("swm log set type 1 off");
    expect(
      firstFrame(swmLog.buildFrames({ action: "setType", idx: 1, enabled: true })).command,
    ).toBe("swm log set type 1 on");
    expect(
      firstFrame(swmLog.buildFrames({ action: "setSwitch", mac: "001DAA0CCD08", enabled: true }))
        .command,
    ).toBe("swm log set switch 001DAA0CCD08 on");
    expect(
      firstFrame(swmLog.buildFrames({ action: "setSwitch", mac: "001DAA0CCD08", enabled: false }))
        .command,
    ).toBe("swm log set switch 001DAA0CCD08 off");

    expect(() => swmLog.buildFrames({ action: "setLevel", idx: 9, enabled: true })).toThrow(/idx/);
    expect(() => swmLog.buildFrames({ action: "setType", idx: 3, enabled: true })).toThrow(/idx/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmLog("> swm log show filter\n")).toEqual({ raw: "> swm log show filter" });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmLog.parse([exchange("> swm log show filter\n")])).toEqual(
      parseSwmLog("> swm log show filter\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmLog, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmLog.buildFrames({ action: "showFilter" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
