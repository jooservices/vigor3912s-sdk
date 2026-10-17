import { describe, expect, it } from "vitest";

import { Vigor3912SClient } from "../../../src/client.js";
import { hsportalLevel } from "../../../src/domains/hsportal.js";
import { parseLevel } from "../../../src/internal/parsers/hsportal/level.js";
import { expectClosedTransportFailure, expectManifestLinkage, firstFrame } from "./support.js";
import { exchange, FakeTransport } from "../../support/fake-transport.js";

describe("cli.hsportal.level -- long-running read (rawLine 11494)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = hsportalLevel.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("hsportal level");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseLevel(" Profile 1 quota policy ... [OK]\n")).toEqual({
      raw: "Profile 1 quota policy ... [OK]",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(hsportalLevel, "read");
  });

  it("invokes and parses through a fake transport with a per-operation timeout", async () => {
    const command = firstFrame(hsportalLevel.buildFrames(undefined)).command;
    const sample = " Profile 1 quota policy ... [OK]\n";
    const transport = new FakeTransport({ responses: [exchange(sample)] });
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.invoke(hsportalLevel, undefined)).resolves.toEqual({
      raw: "Profile 1 quota policy ... [OK]",
    });
    expect(transport.calls.map((call) => call.command)).toEqual([command]);
    expect(transport.calls[0]?.limits.commandTimeoutMs).toBe(120_000);

    await expectClosedTransportFailure(command);
  });

  it("rejects a fake router insufficient-arguments response without parsing it", async () => {
    const transport = new FakeTransport({
      responses: [exchange("% Insufficient arguments !!!")],
    });
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.invoke(hsportalLevel, undefined)).rejects.toMatchObject({
      code: "command_rejected",
    });
    expect(transport.calls.map((call) => call.command)).toEqual(["hsportal level"]);
    expect(transport.calls[0]?.limits.commandTimeoutMs).toBe(120_000);
  });
});
