import { describe, expect, it } from "vitest";

import { swmDb } from "../../../src/domains/swm.js";
import { parseSwmDb } from "../../../src/internal/parsers/swm/db.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.db -- swm db ctl/alert", () => {
  it("builds the documented frame for every variant and rejects invalid input", () => {
    expect(firstFrame(swmDb.buildFrames({ action: "ctlToggle", enabled: true })).command).toBe(
      "swm db ctl en",
    );
    expect(firstFrame(swmDb.buildFrames({ action: "ctlToggle", enabled: false })).command).toBe(
      "swm db ctl dis",
    );
    expect(firstFrame(swmDb.buildFrames({ action: "ctlShow" })).command).toBe("swm db ctl show");
    expect(firstFrame(swmDb.buildFrames({ action: "alertNotify", mode: "N" })).command).toBe(
      "swm db alert notify N",
    );
    expect(firstFrame(swmDb.buildFrames({ action: "alertAction", mode: "B" })).command).toBe(
      "swm db alert action B",
    );
    expect(firstFrame(swmDb.buildFrames({ action: "alertSms", idx: 1 })).command).toBe(
      "swm db alert sms 1",
    );
    expect(firstFrame(swmDb.buildFrames({ action: "alertMail", idx: 2 })).command).toBe(
      "swm db alert mail 2",
    );

    expect(() => swmDb.buildFrames({ action: "alertNotify", mode: "X" as never })).toThrow(/mode/);
    expect(() => swmDb.buildFrames({ action: "alertSms", idx: 0 })).toThrow(/idx/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmDb("Enable database to recoard SWM information.\n")).toEqual({
      raw: "Enable database to recoard SWM information.",
    });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    const sample = "Enable database to recoard SWM information.\n";

    expect(swmDb.parse([exchange(sample)])).toEqual(parseSwmDb(sample));
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmDb, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmDb.buildFrames({ action: "ctlShow" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
