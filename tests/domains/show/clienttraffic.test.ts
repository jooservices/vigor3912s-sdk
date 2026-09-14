import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowClientTraffic } from "../../../src/internal/parsers/show/clienttraffic.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.clienttraffic";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

// Synthetic sample: `cli-reference-raw.txt` line 6928 documents only the
// parameterized syntax (all arguments required) and gives no example
// output at all, so this is a clearly-synthetic placeholder line for the
// bare-command manifest entry, not derived from any real output.
const SAMPLE_TEXT = `> show clienttraffic
device01 wan1 tx=0
`;

describe("cli.show.clienttraffic operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show clienttraffic");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into non-empty, prompt-stripped lines", () => {
    const result = parseShowClientTraffic(SAMPLE_TEXT);

    expect(result).toEqual({ lines: ["device01 wan1 tx=0"] });
  });

  it("(3) is linked to a manifest entry with classification read and status implemented", () => {
    const entry = byId(MANIFEST_ID);

    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("read");
    expect(entry?.status).toBe("implemented");
  });

  it("(4) parses empty output to a minimal-safe empty-lines result, not a crash", async () => {
    const operation = findOperation();

    const emptyResult = await runOperationAgainstFakeTransport(operation, "");
    expect(emptyResult).toEqual({ lines: [] });

    const promptOnlyResult = await runOperationAgainstFakeTransport(operation, "\n>  \n");
    expect(promptOnlyResult).toEqual({ lines: [] });
  });
});
