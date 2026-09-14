import { describe, expect, it } from "vitest";

import type { SessionPolicy, TransportPolicy } from "../../src/live/policy.js";
import { defaultSessionPolicy, defaultTransportPolicy } from "../../src/live/policy.js";

describe("TransportPolicy / SessionPolicy literal type safety", () => {
  it("rejects a non-'private-lan' host kind at compile time", () => {
    const rejected: TransportPolicy = {
      ...defaultTransportPolicy,
      // @ts-expect-error -- allowedHostKinds is fixed to the literal tuple
      // readonly ["private-lan"], not readonly string[]; "public-internet" is
      // not assignable, so widening this field would be a visible type error.
      allowedHostKinds: ["public-internet"],
    };

    expect(rejected.allowedHostKinds).toEqual(["public-internet"]);
  });

  it("rejects enabling agent forwarding at compile time", () => {
    const rejected: TransportPolicy = {
      ...defaultTransportPolicy,
      // @ts-expect-error -- allowAgentForwarding is fixed to the literal type
      // false, not boolean; true is not assignable.
      allowAgentForwarding: true,
    };

    expect(rejected.allowAgentForwarding).toBe(true);
  });

  it("rejects more than one concurrent command at compile time", () => {
    const rejected: SessionPolicy = {
      ...defaultSessionPolicy,
      // @ts-expect-error -- maxConcurrentCommands is fixed to the literal type
      // 1, not number; 2 is not assignable.
      maxConcurrentCommands: 2,
    };

    expect(rejected.maxConcurrentCommands).toBe(2);
  });
});

describe("default policy values", () => {
  it("provides a TransportPolicy default that satisfies the interface", () => {
    const policy: TransportPolicy = defaultTransportPolicy;

    expect(policy).toEqual({
      allowedHostKinds: ["private-lan"],
      port: 22,
      connectTimeoutMs: 15_000,
      allowAgentForwarding: false,
    });
  });

  it("provides a SessionPolicy default that satisfies the interface", () => {
    const policy: SessionPolicy = defaultSessionPolicy;

    expect(policy).toEqual({
      maxConcurrentCommands: 1,
      idleTimeoutMs: 5_000,
      maxSessionMs: 300_000,
    });
  });
});
