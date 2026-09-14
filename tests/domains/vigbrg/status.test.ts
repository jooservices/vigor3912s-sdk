import { describe, expect, it } from "vitest";

import { vigbrgStatus } from "../../../src/domains/vigbrg.js";
import { parseStatus } from "../../../src/internal/parsers/vigbrg/status.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_STATUS_TEXT = [
  "%Vigor Bridge Function is enable!",
  "",
  "%Wan1 management is disable!",
  "",
].join("\n");

describe("cli.vigbrg.status -- vigbrg status (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = vigbrgStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vigbrg status");
  });

  it("parses the documented function/WAN-management lines (synthetic sample)", () => {
    expect(parseStatus(SAMPLE_STATUS_TEXT)).toEqual({
      functionEnabled: true,
      wanManagement: [{ wanLabel: "WAN1", enabled: false }],
    });
  });

  it("returns disabled/empty defaults for text that doesn't match the documented shape", () => {
    expect(parseStatus("not a status line")).toEqual({
      functionEnabled: false,
      wanManagement: [],
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vigbrgStatus, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vigbrgStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_STATUS_TEXT);

    expect(stdout).toBe(SAMPLE_STATUS_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseStatus", () => {
    expect(vigbrgStatus.parse([exchange(SAMPLE_STATUS_TEXT)])).toEqual(
      parseStatus(SAMPLE_STATUS_TEXT),
    );
  });
});
