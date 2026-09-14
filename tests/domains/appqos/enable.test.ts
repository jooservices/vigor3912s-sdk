import { describe, expect, it } from "vitest";

import { appqosEnable } from "../../../src/domains/appqos.js";
import { parseEnable } from "../../../src/internal/parsers/appqos/enable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.appqos.enable -- appqos enable <0/1> (write)", () => {
  it("builds the documented enable/disable frames", () => {
    expect(firstFrame(appqosEnable.buildFrames({ enabled: true })).command).toBe("appqos enable 1");
    expect(firstFrame(appqosEnable.buildFrames({ enabled: false })).command).toBe(
      "appqos enable 0",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseEnable("APP QoS set to Enable.\n")).toEqual({ raw: "APP QoS set to Enable." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(appqosEnable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(appqosEnable.buildFrames({ enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "APP QoS set to Enable.\n");

    expect(stdout).toBe("APP QoS set to Enable.\n");
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(appqosEnable.parse([{ stdout: "APP QoS set to Enable.\n", stderr: "" }])).toEqual({
      raw: "APP QoS set to Enable.",
    });
  });
});
