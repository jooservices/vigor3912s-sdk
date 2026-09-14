import { describe, expect, it } from "vitest";

import { operations } from "../../../src/domains/linux.js";
import { parseLinuxStatus } from "../../../src/internal/parsers/linux/status.js";
import { byId } from "../../../src/manifest/index.js";
import {
  findLinuxOperation,
  runOperationAgainstFakeTransport,
  singleFrameCommand,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.linux.status";

// Clearly-synthetic minimal text -- no example block exists for this family
// in command-map.md or the raw user-guide text.
const SAMPLE_TEXT = "Linux Application Status: Running";

describe("cli.linux.status operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findLinuxOperation(operations, MANIFEST_ID);

    expect(singleFrameCommand(operation, undefined as never)).toBe("linux status");
    // No caller-controlled input exists for this operation (TInput = void):
    // buildFrames ignores whatever is passed to it and always yields the
    // same fixed, safe frame -- there is no injection surface to construct.
    expect(singleFrameCommand(operation, undefined as never)).toBe(
      singleFrameCommand(operation, undefined as never),
    );
  });

  it("(2) parses sample output into the documented minimal status shape", () => {
    expect(parseLinuxStatus(SAMPLE_TEXT)).toEqual({
      raw: "Linux Application Status: Running",
      running: true,
    });
    expect(parseLinuxStatus("Linux Application Status: Stopped")).toEqual({
      raw: "Linux Application Status: Stopped",
      running: false,
    });
  });

  it("(3) is linked to a manifest entry with classification read and status implemented", () => {
    const entry = byId(MANIFEST_ID);

    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("read");
    expect(entry?.status).toBe("implemented");
    expect(entry?.kind).toBe("cli-command");
  });

  it("(4) round-trips through the real runner and a fake transport", async () => {
    const operation = findLinuxOperation(operations, MANIFEST_ID);

    const result = await runOperationAgainstFakeTransport(
      operation,
      undefined as never,
      SAMPLE_TEXT,
    );

    expect(result).toEqual({ raw: SAMPLE_TEXT, running: true });
  });
});
