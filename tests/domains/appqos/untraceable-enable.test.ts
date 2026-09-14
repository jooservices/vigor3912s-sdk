import { describe, expect, it } from "vitest";

import { appqosUntraceableEnable } from "../../../src/domains/appqos.js";
import { parseUntraceableEnable } from "../../../src/internal/parsers/appqos/untraceable-enable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.appqos.untraceable.e -- appqos untraceable -e (write)", () => {
  it("builds the documented enable frame and rejects invalid indexes/classes", () => {
    expect(
      firstFrame(appqosUntraceableEnable.buildFrames({ appIndex: 10, qosClass: 1 })).command,
    ).toBe("appqos untraceable -e 10 1");

    expect(() => appqosUntraceableEnable.buildFrames({ appIndex: -1, qosClass: 1 })).toThrow(
      /appIndex/,
    );
    expect(() => appqosUntraceableEnable.buildFrames({ appIndex: 124, qosClass: 1 })).toThrow(
      /appIndex/,
    );
    expect(() =>
      appqosUntraceableEnable.buildFrames({ appIndex: 10, qosClass: 5 as never }),
    ).toThrow(/qosClass/);
  });

  it("rejects a non-integer appIndex", () => {
    expect(() => appqosUntraceableEnable.buildFrames({ appIndex: 10.5, qosClass: 1 })).toThrow(
      /appIndex must be an integer/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUntraceableEnable("% APP enabled, QoS Class 1\n")).toEqual({
      raw: "% APP enabled, QoS Class 1",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(appqosUntraceableEnable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      appqosUntraceableEnable.buildFrames({ appIndex: 10, qosClass: 1 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% APP enabled, QoS Class 1\n");

    expect(stdout).toBe("% APP enabled, QoS Class 1\n");
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(
      appqosUntraceableEnable.parse([{ stdout: "% APP enabled, QoS Class 1\n", stderr: "" }]),
    ).toEqual({ raw: "% APP enabled, QoS Class 1" });
  });
});
