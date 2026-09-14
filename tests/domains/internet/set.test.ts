import { describe, expect, it } from "vitest";

import { internetSet } from "../../../src/domains/internet.js";
import { parseSet } from "../../../src/internal/parsers/internet/set.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = [
  " WAN1 Internet Mode set to PPPoE/PPPoA",
  " WAN1 ISP Name set to tcom",
  " WAN1 Username set to username",
  " WAN1 Password set successful",
  "",
].join("\n");

describe("cli.internet -- internet -W/-M/... (write)", () => {
  it("builds the documented configure frame and rejects invalid input", () => {
    const frame = firstFrame(
      internetSet.buildFrames({
        mode: 1,
        ispName: "tcom",
        username: "username",
        password: "password",
        pppAuthType: 0,
        idleTimeout: -1,
        pppoeClientIp: "0.0.0.0",
      }),
    );

    expect(frame.command).toBe(
      "internet -M 1 -S tcom -u username -p password -a 0 -t -1 -i 0.0.0.0",
    );

    expect(
      firstFrame(
        internetSet.buildFrames({
          wanInterface: 1,
          mode: 1,
          username: "link1",
          password: "link1",
          pppAuthType: 0,
        }),
      ).command,
    ).toBe("internet -W 1 -M 1 -u link1 -p link1 -a 0");

    expect(() => internetSet.buildFrames({ mode: 8 as never })).toThrow(/mode/);
    expect(() => internetSet.buildFrames({ mode: 1, wanInterface: 0 })).toThrow(/wanInterface/);
    expect(() => internetSet.buildFrames({ mode: 1, wanInterface: 1.5 })).toThrow(
      /wanInterface must be an integer/,
    );
    expect(() => internetSet.buildFrames({ mode: 1, ispName: "has space" })).toThrow(/ispName/);
    expect(() => internetSet.buildFrames({ mode: 1, ispName: "a".repeat(24) })).toThrow(/ispName/);
    expect(() => internetSet.buildFrames({ mode: 1, pppoeService: "maybe" as never })).toThrow(
      /pppoeService/,
    );
    expect(firstFrame(internetSet.buildFrames({ mode: 1, pppoeService: "on" })).command).toBe(
      "internet -M 1 -P on",
    );
    expect(() => internetSet.buildFrames({ mode: 1, idleTimeout: 0 })).toThrow(/idleTimeout/);
    expect(() => internetSet.buildFrames({ mode: 1, username: "a".repeat(50) })).toThrow(
      /username/,
    );
    expect(() => internetSet.buildFrames({ mode: 1, password: "a".repeat(50) })).toThrow(
      /password/,
    );

    const optionalFieldsFrame = firstFrame(
      internetSet.buildFrames({
        mode: 1,
        wanIp: "192.168.1.1",
        wanNetmask: "255.255.255.0",
        gateway: "192.168.1.254",
        serverIp: "192.168.1.253",
        alwaysOnBackupWan: 2,
        backupMode: 1,
      }),
    );

    expect(optionalFieldsFrame.command).toBe(
      "internet -M 1 -w 192.168.1.1 -n 255.255.255.0 -g 192.168.1.254 -s 192.168.1.253 -A 2 -B 1",
    );
  });

  it("rejects a malformed password without echoing the secret into Error.message", () => {
    const secretPassword = "synthetic-only-canary-Pw9Qx";

    let caught: unknown;
    try {
      internetSet.buildFrames({ mode: 1, password: `${secretPassword} has space` });
      throw new Error("expected buildFrames to throw for a malformed password");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toMatch(/password/);
    expect((caught as Error).message).not.toContain(secretPassword);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSet(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(internetSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      internetSet.buildFrames({ mode: 1, username: "link1", password: "link1" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(internetSet.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure(command);
  });
});
