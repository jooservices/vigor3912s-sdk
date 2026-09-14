import { describe, expect, it } from "vitest";

import { operations, type SetLinuxIpInput } from "../../../src/domains/linux.js";
import type { CommandFrame } from "../../../src/internal/execution/framing.js";
import { parseSetLinuxIp } from "../../../src/internal/parsers/linux/setlinuxip.js";
import { byId } from "../../../src/manifest/index.js";
import { findLinuxOperation, runOperationAgainstFakeTransport } from "./test-helpers.js";

const MANIFEST_ID = "cli.linux.setlinuxip";
const SAMPLE_TEXT = "Linux IP configuration saved. Reboot the router to apply.";

function buildFramesOf(input: SetLinuxIpInput): readonly CommandFrame[] {
  const operation = findLinuxOperation(operations, MANIFEST_ID);
  return operation.buildFrames(input as never);
}

describe("cli.linux.setlinuxip operation", () => {
  it("(1) builds a CommandFrame from the documented syntax, incl. rejection cases", () => {
    expect(buildFramesOf({ ip: "198.51.100.5" })[0]?.command).toBe(
      "linux setlinuxip -i 198.51.100.5",
    );
    expect(
      buildFramesOf({ ip: "198.51.100.5", cidr: 30, gateway: "198.51.100.1", vlan: 7 })[0]?.command,
    ).toBe("linux setlinuxip -i 198.51.100.5 -c 30 -g 198.51.100.1 v 7");
    expect(
      buildFramesOf({ ip: "198.51.100.5", password: "redacted-example-only" })[0]?.command,
    ).toBe("linux setlinuxip -i 198.51.100.5 -p redacted-example-only");

    // Rejection cases.
    expect(() => buildFramesOf({ ip: "" })).toThrow(/IP must not be empty/);
    expect(() => buildFramesOf({ ip: "198.51.100.5", cidr: 0 })).toThrow(
      /CIDR must be an integer between 1 and 32/,
    );
    expect(() => buildFramesOf({ ip: "198.51.100.5", cidr: 33 })).toThrow(
      /CIDR must be an integer between 1 and 32/,
    );
    expect(() => buildFramesOf({ ip: "198.51.100.5", vlan: -1 })).toThrow(
      /VLAN must be an integer between 0 and 99/,
    );
    expect(() => buildFramesOf({ ip: "198.51.100.5", vlan: 100 })).toThrow(
      /VLAN must be an integer between 0 and 99/,
    );
    // A value containing a disallowed framing sequence is rejected by
    // `frameSingleCommand`, not silently accepted.
    expect(() => buildFramesOf({ ip: "198.51.100.5;rm-rf" })).toThrow(/disallowed sequence/);
  });

  it("(2) parses sample output into a minimal acknowledgement shape", () => {
    expect(parseSetLinuxIp(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT });
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
      { ip: "198.51.100.5" } satisfies SetLinuxIpInput as never,
      SAMPLE_TEXT,
    );

    expect(result).toEqual({ raw: SAMPLE_TEXT });
  });

  it("(5) never leaks the password argument anywhere except the single constructed CommandFrame", () => {
    const secretPassword = "synthetic-only-canary-Zx9Q7";

    // It IS expected inside the one real frame the router needs -- that is
    // not a leak, it is the argument doing its job.
    const frames = buildFramesOf({ ip: "198.51.100.5", password: secretPassword });
    expect(frames).toHaveLength(1);
    expect(frames[0]?.command).toContain(secretPassword);

    // Every validation-error path below carries the same secret password,
    // but none of the resulting error messages may contain it.
    const rejectionCases: SetLinuxIpInput[] = [
      { ip: "", password: secretPassword },
      { ip: "198.51.100.5", cidr: 0, password: secretPassword },
      { ip: "198.51.100.5", cidr: 33, password: secretPassword },
      { ip: "198.51.100.5", vlan: -1, password: secretPassword },
      { ip: "198.51.100.5", vlan: 100, password: secretPassword },
      { ip: "198.51.100.5;rm -rf", password: secretPassword },
      { ip: "198.51.100.5", password: `${secretPassword};rm -rf` },
    ];

    for (const input of rejectionCases) {
      let caught: unknown;
      try {
        buildFramesOf(input);
        throw new Error("expected buildFrames to throw for this rejection case");
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(Error);
      const message = (caught as Error).message;
      expect(message).not.toContain(secretPassword);
      const { cause } = caught as Error;
      if (typeof cause === "string") {
        expect(cause).not.toContain(secretPassword);
      }
    }

    // The parser side never sees the request password either -- it only
    // ever sees router response text.
    expect(parseSetLinuxIp(SAMPLE_TEXT)).not.toEqual(
      expect.objectContaining({ raw: expect.stringContaining(secretPassword) as unknown }),
    );
  });
});
