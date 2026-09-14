import { describe, expect, it } from "vitest";

import { ddnsForceUpdate } from "../../../src/domains/ddns.js";
import { parseForceUpdate } from "../../../src/internal/parsers/ddns/forceupdate.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = [
  " Now updating DDNS ...",
  ' Please check result by using command "ddns log"',
  "",
].join("\n");

describe("cli.ddns.forceupdate -- ddns forceupdate", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(ddnsForceUpdate.buildFrames(undefined));

    expect(frame.command).toBe("ddns forceupdate");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseForceUpdate(SAMPLE_TEXT)).toEqual({
      raw: 'Now updating DDNS ...\n Please check result by using command "ddns log"',
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ddnsForceUpdate, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ddnsForceUpdate.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseForceUpdate", () => {
    expect(ddnsForceUpdate.parse([exchange(SAMPLE_TEXT)])).toEqual(parseForceUpdate(SAMPLE_TEXT));
  });
});
