import { describe, expect, it } from "vitest";

import { fsLs } from "../../../src/domains/fs.js";
import { parseFsLs } from "../../../src/internal/parsers/fs/ls.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "file1.txt\nfile2.bin\n";

describe("cli.fs.ls -- fs ls", () => {
  it("builds the documented no-argument frame", () => {
    const frames = fsLs.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("fs ls");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseFsLs(SAMPLE_TEXT)).toEqual({
      raw: "file1.txt\nfile2.bin",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(fsLs, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(fsLs.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(fsLs.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "file1.txt\nfile2.bin",
    });

    await expectClosedTransportFailure(command);
  });
});
