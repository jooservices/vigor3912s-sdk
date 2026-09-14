import { describe, expect, it } from "vitest";

import { fsPwd } from "../../../src/domains/fs.js";
import { parseFsPwd } from "../../../src/internal/parsers/fs/pwd.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "/tmp\n";

describe("cli.fs.pwd -- fs pwd", () => {
  it("builds the documented no-argument frame", () => {
    const frames = fsPwd.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("fs pwd");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseFsPwd(SAMPLE_TEXT)).toEqual({
      raw: "/tmp",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(fsPwd, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(fsPwd.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(fsPwd.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "/tmp",
    });

    await expectClosedTransportFailure(command);
  });
});
