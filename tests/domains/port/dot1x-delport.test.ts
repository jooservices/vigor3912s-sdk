import { describe, expect, it } from "vitest";

import { port8021xDelport } from "../../../src/domains/port.js";
import { parseDot1xDelport } from "../../../src/internal/parsers/port/dot1x-delport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Del 802.1x port OK\n";

describe("cli.port.8021x.delport -- port 802.1x delport (write)", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(port8021xDelport.buildFrames({ portNumber: 2 }));

    expect(frame.command).toBe("port 802.1x delport 2");
    expect(() => port8021xDelport.buildFrames({ portNumber: 0 })).toThrow(/portNumber/);
    expect(() => port8021xDelport.buildFrames({ portNumber: 6 })).toThrow(/portNumber/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDot1xDelport(SAMPLE_TEXT)).toEqual({ raw: "% Del 802.1x port OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(port8021xDelport, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(port8021xDelport.buildFrames({ portNumber: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(port8021xDelport.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Del 802.1x port OK",
    });

    await expectClosedTransportFailure(command);
  });
});
