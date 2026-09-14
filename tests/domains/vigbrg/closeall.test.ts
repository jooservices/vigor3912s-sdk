import { describe, expect, it } from "vitest";

import { vigbrgCloseall } from "../../../src/domains/vigbrg.js";
import { parseCloseall } from "../../../src/internal/parsers/vigbrg/closeall.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "Close all bridge and bridge firewall\n";

describe("cli.vigbrg.closeall -- vigbrg closeall", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vigbrgCloseall.buildFrames(undefined));

    expect(frame.command).toBe("vigbrg closeall");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseCloseall(SAMPLE_TEXT)).toEqual({
      raw: "Close all bridge and bridge firewall",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vigbrgCloseall, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vigbrgCloseall.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseCloseall", () => {
    expect(vigbrgCloseall.parse([exchange(SAMPLE_TEXT)])).toEqual(parseCloseall(SAMPLE_TEXT));
  });
});
