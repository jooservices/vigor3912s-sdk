import { describe, expect, it } from "vitest";

import { swmAlert } from "../../../src/domains/swm.js";
import { parseSwmAlert } from "../../../src/internal/parsers/swm/alert.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.alert -- swm alert toggle/show/set/display", () => {
  it("builds the documented frame for every variant and rejects invalid input", () => {
    expect(firstFrame(swmAlert.buildFrames({ action: "toggle", enabled: true })).command).toBe(
      "swm alert enable",
    );
    expect(firstFrame(swmAlert.buildFrames({ action: "toggle", enabled: false })).command).toBe(
      "swm alert disable",
    );
    expect(firstFrame(swmAlert.buildFrames({ action: "show" })).command).toBe("swm alert show");
    expect(
      firstFrame(swmAlert.buildFrames({ action: "actionToggle", idx: 2, enabled: true })).command,
    ).toBe("swm alert en 2");
    expect(
      firstFrame(swmAlert.buildFrames({ action: "actionToggle", idx: 2, enabled: false })).command,
    ).toBe("swm alert dis 2");
    expect(
      firstFrame(swmAlert.buildFrames({ action: "setLog", idx: 2, enabled: false })).command,
    ).toBe("swm alert set 2 log d");
    expect(
      firstFrame(swmAlert.buildFrames({ action: "setLog", idx: 2, enabled: true })).command,
    ).toBe("swm alert set 2 log e");
    expect(
      firstFrame(swmAlert.buildFrames({ action: "setName", idx: 2, name: "Minor" })).command,
    ).toBe("swm alert set 2 name Minor");
    expect(
      firstFrame(swmAlert.buildFrames({ action: "setColor", idx: 2, color: "N" })).command,
    ).toBe("swm alert set 2 color N");
    expect(
      firstFrame(swmAlert.buildFrames({ action: "setNotif", idx: 3, enabled: true })).command,
    ).toBe("swm alert set 3 notif e");
    expect(
      firstFrame(swmAlert.buildFrames({ action: "setNotif", idx: 3, enabled: false })).command,
    ).toBe("swm alert set 3 notif d");
    expect(
      firstFrame(
        swmAlert.buildFrames({ action: "setObject", idx: 3, objectIndex: 1, objectValue: 1 }),
      ).command,
    ).toBe("swm alert set 3 obj 1 1");
    expect(firstFrame(swmAlert.buildFrames({ action: "display" })).command).toBe(
      "swm alert display",
    );

    expect(() => swmAlert.buildFrames({ action: "setColor", idx: 1, color: "N" })).toThrow(/idx/);
    expect(() => swmAlert.buildFrames({ action: "setNotif", idx: 2, enabled: true })).toThrow(
      /idx/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmAlert("> swm alert show\n")).toEqual({ raw: "> swm alert show" });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmAlert.parse([exchange("> swm alert show\n")])).toEqual(
      parseSwmAlert("> swm alert show\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmAlert, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmAlert.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
