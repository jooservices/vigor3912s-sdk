import { describe, expect, it } from "vitest";

import { apmDisable } from "../../../src/domains/apm.js";
import { parseDisable } from "../../../src/internal/parsers/apm/disable.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.disable -- apm disable", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmDisable.buildFrames(undefined));

    expect(frame.command).toBe("apm disable");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDisable("% APM disabled.\n")).toEqual({
      raw: "% APM disabled.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(apmDisable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmDisable.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% APM disabled.");

    expect(stdout).toBe("% APM disabled.");
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseDisable", () => {
    expect(apmDisable.parse([exchange("% APM disabled.")])).toEqual(
      parseDisable("% APM disabled."),
    );
  });
});
