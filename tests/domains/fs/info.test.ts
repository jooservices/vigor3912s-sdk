import { describe, expect, it } from "vitest";

import { fsInfo } from "../../../src/domains/fs.js";
import { parseFsInfo } from "../../../src/internal/parsers/fs/info.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "FS size: 128MB used: 40MB\n";

describe("cli.fs.info -- fs info", () => {
  it("builds the documented no-argument frame", () => {
    const frames = fsInfo.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("fs info");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseFsInfo(SAMPLE_TEXT)).toEqual({
      raw: "FS size: 128MB used: 40MB",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(fsInfo, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(fsInfo.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(fsInfo.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "FS size: 128MB used: 40MB",
    });

    await expectClosedTransportFailure(command);
  });
});
