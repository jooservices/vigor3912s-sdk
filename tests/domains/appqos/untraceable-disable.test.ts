import { describe, expect, it } from "vitest";

import { appqosUntraceableDisable } from "../../../src/domains/appqos.js";
import { parseUntraceableDisable } from "../../../src/internal/parsers/appqos/untraceable-disable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.appqos.untraceable.d -- appqos untraceable -d (write)", () => {
  it("builds the documented disable frame and rejects invalid indexes", () => {
    expect(firstFrame(appqosUntraceableDisable.buildFrames({ appIndex: 70 })).command).toBe(
      "appqos untraceable -d 70",
    );

    expect(() => appqosUntraceableDisable.buildFrames({ appIndex: 200 })).toThrow(/appIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUntraceableDisable("% APP disabled\n")).toEqual({ raw: "% APP disabled" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(appqosUntraceableDisable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(appqosUntraceableDisable.buildFrames({ appIndex: 70 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% APP disabled\n");

    expect(stdout).toBe("% APP disabled\n");
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(appqosUntraceableDisable.parse([{ stdout: "% APP disabled\n", stderr: "" }])).toEqual({
      raw: "% APP disabled",
    });
  });
});
