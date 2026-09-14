import { describe, expect, it } from "vitest";

import { appqosTraceableEnable } from "../../../src/domains/appqos.js";
import { parseTraceableEnable } from "../../../src/internal/parsers/appqos/traceable-enable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.appqos.traceable.e -- appqos traceable -e (write)", () => {
  it("builds the documented enable frame and rejects invalid indexes/classes", () => {
    expect(
      firstFrame(appqosTraceableEnable.buildFrames({ appIndex: 68, qosClass: 2 })).command,
    ).toBe("appqos traceable -e 68 2");

    expect(() => appqosTraceableEnable.buildFrames({ appIndex: 1 as never, qosClass: 2 })).toThrow(
      /appIndex/,
    );
    expect(() => appqosTraceableEnable.buildFrames({ appIndex: 68, qosClass: 5 as never })).toThrow(
      /qosClass/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseTraceableEnable("SSH: ENABLED, QoS Class 2.\n")).toEqual({
      raw: "SSH: ENABLED, QoS Class 2.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(appqosTraceableEnable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      appqosTraceableEnable.buildFrames({ appIndex: 68, qosClass: 2 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "SSH: ENABLED, QoS Class 2.\n");

    expect(stdout).toBe("SSH: ENABLED, QoS Class 2.\n");
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(
      appqosTraceableEnable.parse([{ stdout: "SSH: ENABLED, QoS Class 2.\n", stderr: "" }]),
    ).toEqual({ raw: "SSH: ENABLED, QoS Class 2." });
  });
});
