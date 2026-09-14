import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowCocpu } from "../../../src/internal/parsers/show/cocpu.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.cocpu";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

const SAMPLE_TEXT = "CoCPU usage: 5%\n";

describe("cli.show.cocpu operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show cocpu");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into trimmed raw text", () => {
    expect(parseShowCocpu(SAMPLE_TEXT)).toEqual({ raw: "CoCPU usage: 5%" });
  });

  it("(3) is linked to a manifest entry with classification read and status implemented", () => {
    const entry = byId(MANIFEST_ID);

    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("read");
    expect(entry?.status).toBe("implemented");
  });

  it("(4) parses empty/malformed output without crashing", async () => {
    const operation = findOperation();

    const emptyResult = await runOperationAgainstFakeTransport(operation, "");
    expect(emptyResult).toEqual({ raw: "" });

    const malformedResult = await runOperationAgainstFakeTransport(operation, "  garbage  \n");
    expect(malformedResult).toEqual({ raw: "garbage" });
  });
});
