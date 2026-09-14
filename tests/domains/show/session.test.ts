import { describe, expect, it } from "vitest";

import { byId } from "../../../src/manifest/index.js";
import { operations } from "../../../src/domains/show.js";
import { parseShowSession } from "../../../src/internal/parsers/show/session.js";
import { runOperationAgainstFakeTransport, singleFrameCommand } from "./test-helpers.js";

const MANIFEST_ID = "cli.show.session";

function findOperation() {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation;
}

// Synthetic sample -- structure mirrors the session-usage summary
// documented at `cli-reference-raw.txt` line 6841, values changed to
// obviously-placeholder numbers.
const SAMPLE_TEXT = `% Maximum Session Number: 111111
% Maximum Session Usage: 3
% Current Session Usage: 3
% Current Session Used(include waiting for free): 9
% WAN1 Current Session Usage: 1
% WAN2 Current Session Usage: 0
## Session Create this Sec: 2
## Session Create Peak Sec: 8
`;

describe("cli.show.session operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findOperation();

    expect(singleFrameCommand(operation)).toBe("show session");
    expect(singleFrameCommand(operation)).toBe(singleFrameCommand(operation));
  });

  it("(2) parses sample output into the session-usage summary", () => {
    const result = parseShowSession(SAMPLE_TEXT);

    expect(result).toEqual({
      maxSessionNumber: 111111,
      maxSessionUsage: 3,
      currentSessionUsage: 3,
      currentSessionUsed: 9,
      wanUsage: [
        { wan: 1, usage: 1 },
        { wan: 2, usage: 0 },
      ],
      sessionCreateThisSec: 2,
      sessionCreatePeakSec: 8,
    });
  });

  it("(3) is linked to a manifest entry with classification read and status implemented", () => {
    const entry = byId(MANIFEST_ID);

    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("read");
    expect(entry?.status).toBe("implemented");
  });

  it("(4) parses malformed/empty output to a minimal-safe result, not a crash", async () => {
    const operation = findOperation();

    const emptyResult = await runOperationAgainstFakeTransport(operation, "");
    expect(emptyResult).toEqual({
      maxSessionNumber: null,
      maxSessionUsage: null,
      currentSessionUsage: null,
      currentSessionUsed: null,
      wanUsage: [],
      sessionCreateThisSec: null,
      sessionCreatePeakSec: null,
    });

    const malformedResult = await runOperationAgainstFakeTransport(operation, "garbage");
    expect(malformedResult).toEqual({
      maxSessionNumber: null,
      maxSessionUsage: null,
      currentSessionUsage: null,
      currentSessionUsed: null,
      wanUsage: [],
      sessionCreateThisSec: null,
      sessionCreatePeakSec: null,
    });
  });
});
