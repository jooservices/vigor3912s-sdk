import { describe, expect, it } from "vitest";

import { port8021xDisable } from "../../../src/domains/port.js";
import { parseDot1xDisable } from "../../../src/internal/parsers/port/dot1x-disable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% 802.1x disabled\\n";

describe("cli.port.8021x.disable -- port 802.1x disable (write)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = port8021xDisable.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("port 802.1x disable");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDot1xDisable(SAMPLE_TEXT)).toEqual({ raw: "% 802.1x disabled\\n" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(port8021xDisable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(port8021xDisable.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(port8021xDisable.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% 802.1x disabled\\n",
    });

    await expectClosedTransportFailure(command);
  });
});
