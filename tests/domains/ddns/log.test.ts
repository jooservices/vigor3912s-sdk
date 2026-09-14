import { describe, expect, it } from "vitest";

import { ddnsLog } from "../../../src/domains/ddns.js";
import { parseLog } from "../../../src/internal/parsers/ddns/log.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

describe("cli.ddns.log -- ddns log (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(ddnsLog.buildFrames(undefined));

    expect(frame.command).toBe("ddns log");
  });

  it("parses the documented output text (synthetic sample)", () => {
    expect(parseLog("DDNS Update OK: 2026/09/13 10:00:00\n")).toEqual({
      raw: "DDNS Update OK: 2026/09/13 10:00:00",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ddnsLog, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ddnsLog.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "DDNS Update OK: 2026/09/13 10:00:00\n",
    );

    expect(stdout).toBe("DDNS Update OK: 2026/09/13 10:00:00\n");
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseLog", () => {
    expect(ddnsLog.parse([exchange("DDNS Update OK: 2026/09/13 10:00:00\n")])).toEqual(
      parseLog("DDNS Update OK: 2026/09/13 10:00:00\n"),
    );
  });
});
