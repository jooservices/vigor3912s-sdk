import { describe, expect, it } from "vitest";

import { portmaptimeList } from "../../../src/domains/portmaptime.js";
import { parseList } from "../../../src/internal/parsers/portmaptime/list.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT =
  "------ Current setting ------\nTCP Timeout   : 86400 sec.\nUDP Timeout   : 300 sec.\n";

describe("cli.portmaptime.l -- portmaptime -l (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = portmaptimeList.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("portmaptime -l");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseList(SAMPLE_TEXT)).toEqual({
      raw: "------ Current setting ------\nTCP Timeout   : 86400 sec.\nUDP Timeout   : 300 sec.",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(portmaptimeList, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(portmaptimeList.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("parses through the operation's own `parse` using the first exchange's stdout", () => {
    expect(portmaptimeList.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual({
      raw: "------ Current setting ------\nTCP Timeout   : 86400 sec.\nUDP Timeout   : 300 sec.",
    });
  });

  it("parses an empty raw string when no exchange is present (defensive fallback)", () => {
    expect(portmaptimeList.parse([])).toEqual({ raw: "" });
  });
});
