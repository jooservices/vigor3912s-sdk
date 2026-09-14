import { describe, expect, it } from "vitest";

import { portSniff } from "../../../src/domains/port.js";
import { parseSniff } from "../../../src/internal/parsers/port/sniff.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Sniff txrx set OK\n";

describe("cli.port.sniff -- port sniff <on|off|port|txrx|restart> (write)", () => {
  it("builds the documented frames for each variant and rejects invalid input", () => {
    expect(firstFrame(portSniff.buildFrames({ action: "on" })).command).toBe("port sniff on");
    expect(firstFrame(portSniff.buildFrames({ action: "off" })).command).toBe("port sniff off");
    expect(firstFrame(portSniff.buildFrames({ action: "restart" })).command).toBe(
      "port sniff restart",
    );
    expect(firstFrame(portSniff.buildFrames({ action: "port", lanPort: "p3" })).command).toBe(
      "port sniff port p3",
    );
    expect(
      firstFrame(portSniff.buildFrames({ action: "txrx", rate: 30000, lanPort: "p2" })).command,
    ).toBe("port sniff txrx 30000 p2");

    expect(() => portSniff.buildFrames({ action: "port", lanPort: "p9" as never })).toThrow(
      /lanPort/,
    );
    expect(() => portSniff.buildFrames({ action: "txrx", rate: 0, lanPort: "p1" })).toThrow(/rate/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSniff(SAMPLE_TEXT)).toEqual({ raw: "% Sniff txrx set OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(portSniff, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(portSniff.buildFrames({ action: "on" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(portSniff.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Sniff txrx set OK" });

    await expectClosedTransportFailure(command);
  });
});
