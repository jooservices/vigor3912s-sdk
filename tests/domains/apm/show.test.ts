import { describe, expect, it } from "vitest";

import { apmShow } from "../../../src/domains/apm.js";
import { parseShow } from "../../../src/internal/parsers/apm/show.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.show -- apm show", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmShow.buildFrames(undefined));

    expect(frame.command).toBe("apm show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseShow("% APM status: enabled\n")).toEqual({
      raw: "% APM status: enabled",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(apmShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmShow.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% APM status: enabled");

    expect(stdout).toBe("% APM status: enabled");
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseShow", () => {
    expect(apmShow.parse([exchange("% APM status: enabled")])).toEqual(
      parseShow("% APM status: enabled"),
    );
  });
});
