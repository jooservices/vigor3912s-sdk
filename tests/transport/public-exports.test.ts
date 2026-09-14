import { describe, expect, it } from "vitest";

import type {
  CommandExchange,
  CommandFrame,
  ExecutionLimits,
  Transport,
  TransportExchange,
} from "../../src/transport/index.js";
import { FakeTransport, exchange } from "../support/fake-transport.js";

describe("public transport subpath exports", () => {
  it("resolves the ./transport subpath from source, mirroring tests/index.test.ts's pattern", async () => {
    const module: Record<string, unknown> = await import("../../src/transport/index.js");

    // Every name this barrel re-exports is type-only, so there is nothing to
    // check at the value level -- this import succeeding at all (with no
    // thrown module-resolution error) is itself the proof the subpath is a
    // real, loadable ES module.
    expect(Object.keys(module)).toEqual([]);
  });

  it("a FakeTransport satisfies the publicly-exported Transport type (structural + type-level check)", () => {
    const transport: Transport = new FakeTransport({ responses: [exchange("ok")] });

    expect(transport.isOpen).toBe(true);
    expect(typeof transport.send).toBe("function");
    expect(typeof transport.close).toBe("function");
  });

  it("CommandExchange and TransportExchange stay structurally compatible (type-level only)", () => {
    const commandExchange: CommandExchange = { stdout: "a", stderr: "b" };
    const transportExchange: TransportExchange = commandExchange;

    expect(transportExchange).toEqual({ stdout: "a", stderr: "b" });
  });

  it("re-exports ExecutionLimits for public Transport.send() implementations", () => {
    const limits: ExecutionLimits = {
      maxCommandBytes: 1024,
      commandTimeoutMs: 15_000,
      idleTimeoutMs: 5_000,
      maxOutputBytes: 4 * 1024 * 1024,
    };

    expect(limits.commandTimeoutMs).toBe(15_000);
  });

  it("re-exports CommandFrame as a type usable in an annotation (type-level only)", () => {
    const assertFrameType = (frame: CommandFrame): string => frame.command;

    expect(typeof assertFrameType).toBe("function");
  });
});
