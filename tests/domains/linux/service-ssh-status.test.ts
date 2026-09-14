import { describe, expect, it } from "vitest";

import { operations } from "../../../src/domains/linux.js";
import { parseServiceSshStatus } from "../../../src/internal/parsers/linux/service-ssh-status.js";
import { byId } from "../../../src/manifest/index.js";
import {
  findLinuxOperation,
  runOperationAgainstFakeTransport,
  singleFrameCommand,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.linux.service.ssh.status";
const SAMPLE_TEXT = "SSH Service Status: Enabled";

describe("cli.linux.service.ssh.status operation", () => {
  it("(1) builds exactly one CommandFrame for the literal, argument-free command", () => {
    const operation = findLinuxOperation(operations, MANIFEST_ID);

    expect(singleFrameCommand(operation, undefined as never)).toBe("linux service ssh status");
  });

  it("(2) parses sample output into a minimal enabled/disabled shape", () => {
    expect(parseServiceSshStatus(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT, enabled: true });
    expect(parseServiceSshStatus("SSH Service Status: Disabled")).toEqual({
      raw: "SSH Service Status: Disabled",
      enabled: false,
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

    expect(result).toEqual({ raw: SAMPLE_TEXT, enabled: true });
  });
});
