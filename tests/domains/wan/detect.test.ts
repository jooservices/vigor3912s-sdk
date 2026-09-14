import { describe, expect, it } from "vitest";

import { wanDetect } from "../../../src/domains/wan.js";
import { parseDetect } from "../../../src/internal/parsers/wan/detect.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.detect -- wan detect status (read-only query)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = wanDetect.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("wan detect status");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDetect(" Set OK\n")).toEqual({ raw: "Set OK" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(wanDetect, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanDetect.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Set OK");

    expect(stdout).toBe("Set OK");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanDetect.parse([{ stdout: " Set OK\n", stderr: "" }])).toEqual(
      parseDetect(" Set OK\n"),
    );
  });
});
