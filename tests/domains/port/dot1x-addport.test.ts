import { describe, expect, it } from "vitest";

import { port8021xAddport } from "../../../src/domains/port.js";
import { parseDot1xAddport } from "../../../src/internal/parsers/port/dot1x-addport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Add 802.1x port OK\n";

describe("cli.port.8021x.addport -- port 802.1x addport (write)", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(port8021xAddport.buildFrames({ portNumber: 3 }));

    expect(frame.command).toBe("port 802.1x addport 3");
    expect(() => port8021xAddport.buildFrames({ portNumber: 0 })).toThrow(/portNumber/);
    expect(() => port8021xAddport.buildFrames({ portNumber: 6 })).toThrow(/portNumber/);
    expect(() => port8021xAddport.buildFrames({ portNumber: 2.5 })).toThrow(/must be an integer/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDot1xAddport(SAMPLE_TEXT)).toEqual({ raw: "% Add 802.1x port OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(port8021xAddport, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(port8021xAddport.buildFrames({ portNumber: 3 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(port8021xAddport.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Add 802.1x port OK",
    });

    await expectClosedTransportFailure(command);
  });
});
