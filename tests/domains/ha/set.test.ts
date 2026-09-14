import { describe, expect, it } from "vitest";

import { haSet } from "../../../src/domains/ha.js";
import { parseHaSet } from "../../../src/internal/parsers/ha/set.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ha.set -- ha set [-<command> <parameter>|...]", () => {
  it("builds the documented flagged frame and rejects empty/unknown-flag input", () => {
    const frame = firstFrame(haSet.buildFrames({ args: ["-h", "LAN1", "192.168.1.5"] }));

    expect(frame.command).toBe("ha set -h LAN1 192.168.1.5");

    expect(() => haSet.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => haSet.buildFrames({ args: ["-z"] })).toThrow(/is not one of the documented flags/);
  });

  it("rejects an injection attempt embedded in an argument token", () => {
    expect(() => haSet.buildFrames({ args: ["-k", "secret;sys reboot"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("rejects an empty/whitespace-only argument token", () => {
    expect(() => haSet.buildFrames({ args: [""] })).toThrow(/must not be empty or whitespace-only/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseHaSet("% Enable IPv4 Virtual IP on LAN1\n")).toEqual({
      raw: "% Enable IPv4 Virtual IP on LAN1",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(haSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(haSet.buildFrames({ args: ["-e", "1"] })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Enable IPv4 Virtual IP on LAN1\n",
    );

    expect(haSet.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Enable IPv4 Virtual IP on LAN1",
    });

    await expectClosedTransportFailure(command);
  });

  it("parses an empty raw string when no exchange is present (defensive fallback)", () => {
    expect(haSet.parse([])).toEqual({ raw: "" });
  });
});
