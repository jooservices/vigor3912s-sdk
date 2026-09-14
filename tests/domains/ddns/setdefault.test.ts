import { describe, expect, it } from "vitest";

import { ddnsSetdefault } from "../../../src/domains/ddns.js";
import { parseSetdefault } from "../../../src/internal/parsers/ddns/setdefault.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "Set to Factory Default.\n";

describe("cli.ddns.setdefault", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(ddnsSetdefault.buildFrames(undefined));

    expect(frame.command).toBe("ddns setdefault");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseSetdefault(SAMPLE_TEXT)).toEqual({
      raw: "Set to Factory Default.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ddnsSetdefault, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ddnsSetdefault.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseSetdefault", () => {
    expect(ddnsSetdefault.parse([exchange(SAMPLE_TEXT)])).toEqual(parseSetdefault(SAMPLE_TEXT));
  });
});
