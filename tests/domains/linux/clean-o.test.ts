import { describe, expect, it } from "vitest";

import { operations } from "../../../src/domains/linux.js";
import { parseCleanO } from "../../../src/internal/parsers/linux/clean-o.js";
import { byId } from "../../../src/manifest/index.js";
import {
  findLinuxOperation,
  runOperationAgainstFakeTransport,
  singleFrameCommand,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.linux.clean.o";
const SAMPLE_TEXT = "Linux application removed. Rebooting Vigor system with current configuration.";

describe("cli.linux.clean.o operation (destructive)", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findLinuxOperation(operations, MANIFEST_ID);

    expect(singleFrameCommand(operation, undefined as never)).toBe("linux clean -o");
  });

  it("(2) parses sample output into a minimal acknowledgement shape", () => {
    expect(parseCleanO(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT });
  });

  it("(3) is linked to a manifest entry classified destructive, implemented, with TypedOperation.classification matching", () => {
    const entry = byId(MANIFEST_ID);
    const operation = findLinuxOperation(operations, MANIFEST_ID);

    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("destructive");
    expect(entry?.status).toBe("implemented");
    expect(entry?.kind).toBe("cli-command");
    expect(operation.classification).toBe("destructive");
  });

  it("(4) round-trips through the real runner and a fake transport (fake transport only, never a real router)", async () => {
    const operation = findLinuxOperation(operations, MANIFEST_ID);

    const result = await runOperationAgainstFakeTransport(
      operation,
      undefined as never,
      SAMPLE_TEXT,
    );

    expect(result).toEqual({ raw: SAMPLE_TEXT });
  });
});
