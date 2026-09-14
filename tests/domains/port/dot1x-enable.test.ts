import { describe, expect, it } from "vitest";

import { port8021xEnable } from "../../../src/domains/port.js";
import { parseDot1xEnable } from "../../../src/internal/parsers/port/dot1x-enable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% 802.1x enabled\\n";

describe("cli.port.8021x.enable -- port 802.1x enable (write)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = port8021xEnable.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("port 802.1x enable");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDot1xEnable(SAMPLE_TEXT)).toEqual({ raw: "% 802.1x enabled\\n" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(port8021xEnable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(port8021xEnable.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(port8021xEnable.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% 802.1x enabled\\n",
    });

    await expectClosedTransportFailure(command);
  });
});
