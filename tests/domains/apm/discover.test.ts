import { describe, expect, it } from "vitest";

import { apmDiscover } from "../../../src/domains/apm.js";
import { parseDiscover } from "../../../src/internal/parsers/apm/discover.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.discover -- apm discover", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmDiscover.buildFrames(undefined));

    expect(frame.command).toBe("apm discover");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDiscover("% Discovering APs...\n")).toEqual({
      raw: "% Discovering APs...",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(apmDiscover, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmDiscover.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Discovering APs...");

    expect(stdout).toBe("% Discovering APs...");
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseDiscover", () => {
    expect(apmDiscover.parse([exchange("% Discovering APs...")])).toEqual(
      parseDiscover("% Discovering APs..."),
    );
  });
});
