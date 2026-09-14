import { describe, expect, it } from "vitest";

import { apmClear } from "../../../src/domains/apm.js";
import { parseClear } from "../../../src/internal/parsers/apm/clear.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.clear -- apm clear", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmClear.buildFrames(undefined));

    expect(frame.command).toBe("apm clear");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseClear("Clear all clients ... done\n")).toEqual({
      raw: "Clear all clients ... done",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(apmClear, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmClear.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Clear all clients ... done");

    expect(stdout).toBe("Clear all clients ... done");
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseClear", () => {
    expect(apmClear.parse([exchange("Clear all clients ... done")])).toEqual(
      parseClear("Clear all clients ... done"),
    );
  });
});
