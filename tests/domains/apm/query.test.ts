import { describe, expect, it } from "vitest";

import { apmQuery } from "../../../src/domains/apm.js";
import { parseQuery } from "../../../src/internal/parsers/apm/query.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.query -- apm query", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(apmQuery.buildFrames(undefined));

    expect(frame.command).toBe("apm query");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseQuery("% Querying registered APs...\n")).toEqual({
      raw: "% Querying registered APs...",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(apmQuery, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(apmQuery.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Querying registered APs...");

    expect(stdout).toBe("% Querying registered APs...");
    await expectClosedTransportFailure(command);
  });
  it("wires the operation's parse through firstExchangeText to parseQuery", () => {
    expect(apmQuery.parse([exchange("% Querying registered APs...")])).toEqual(
      parseQuery("% Querying registered APs..."),
    );
  });
});
