import { describe, expect, it } from "vitest";

import { operations, type ServiceSshSetportInput } from "../../../src/domains/linux.js";
import { parseServiceSshSetport } from "../../../src/internal/parsers/linux/service-ssh-setport.js";
import { byId } from "../../../src/manifest/index.js";
import {
  findLinuxOperation,
  runOperationAgainstFakeTransport,
  singleFrameCommand,
} from "./test-helpers.js";

const MANIFEST_ID = "cli.linux.service.ssh.setport";
const SAMPLE_TEXT = "SSH port updated. Reboot may be required.";

describe("cli.linux.service.ssh.setport operation", () => {
  it("(1) builds a CommandFrame with the numeric port, and rejects out-of-range/non-integer ports", () => {
    const operation = findLinuxOperation(operations, MANIFEST_ID);

    expect(singleFrameCommand(operation, { port: 22 } as never)).toBe(
      "linux service ssh setport 22",
    );
    expect(singleFrameCommand(operation, { port: 65535 } as never)).toBe(
      "linux service ssh setport 65535",
    );
    expect(singleFrameCommand(operation, { port: 1 } as never)).toBe("linux service ssh setport 1");

    for (const port of [0, -1, 65536, 1.5, Number.NaN]) {
      expect(() =>
        operation.buildFrames({ port } satisfies ServiceSshSetportInput as never),
      ).toThrow(/port must be an integer between 1 and 65535/);
    }
  });

  it("(2) parses sample output into a minimal acknowledgement shape", () => {
    expect(parseServiceSshSetport(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT });
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
      { port: 2222 } satisfies ServiceSshSetportInput as never,
      SAMPLE_TEXT,
    );

    expect(result).toEqual({ raw: SAMPLE_TEXT });
  });
});
