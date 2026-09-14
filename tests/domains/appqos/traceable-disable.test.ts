import { describe, expect, it } from "vitest";

import { appqosTraceableDisable } from "../../../src/domains/appqos.js";
import { parseTraceableDisable } from "../../../src/internal/parsers/appqos/traceable-disable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.appqos.traceable.d -- appqos traceable -d (write)", () => {
  it("builds the documented disable frame and rejects invalid indexes", () => {
    expect(firstFrame(appqosTraceableDisable.buildFrames({ appIndex: 50 })).command).toBe(
      "appqos traceable -d 50",
    );

    expect(() => appqosTraceableDisable.buildFrames({ appIndex: 1 as never })).toThrow(/appIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseTraceableDisable("% APP disabled\n")).toEqual({ raw: "% APP disabled" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(appqosTraceableDisable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(appqosTraceableDisable.buildFrames({ appIndex: 50 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% APP disabled\n");

    expect(stdout).toBe("% APP disabled\n");
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(appqosTraceableDisable.parse([{ stdout: "% APP disabled\n", stderr: "" }])).toEqual({
      raw: "% APP disabled",
    });
  });
});
