import { describe, expect, it } from "vitest";

import { operations } from "../../../src/domains/linux.js";
import { parseServiceSshDisable } from "../../../src/internal/parsers/linux/service-ssh-disable.js";
import { byId } from "../../../src/manifest/index.js";
import {
  findLinuxOperation,
  runOperationAgainstFakeTransport,
  singleFrameCommand,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.linux.service.ssh.disable";
const SAMPLE_TEXT = "SSH service disabled for Linux applications.";

describe("cli.linux.service.ssh.disable operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findLinuxOperation(operations, MANIFEST_ID);

    expect(singleFrameCommand(operation, undefined as never)).toBe("linux service ssh disable");
  });

  it("(2) parses sample output into a minimal acknowledgement shape", () => {
    expect(parseServiceSshDisable(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT });
  });

  it("(3) is linked to a manifest entry with classification write and status implemented", () => {
    const entry = byId(MANIFEST_ID);

    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("write");
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

    expect(result).toEqual({ raw: SAMPLE_TEXT });
  });
});
