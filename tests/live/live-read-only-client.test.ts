import { afterEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

import { sdkErrorCodes } from "../../src/errors.js";
import { frameSingleCommand } from "../../src/internal/execution/framing.js";
import {
  defaultExecutionLimits,
  type ExecutionLimits,
} from "../../src/internal/execution/limits.js";
import type { TypedOperation } from "../../src/internal/registry/operation.js";
import type { TransportExchange } from "../../src/internal/execution/transport.js";
import {
  LiveClientRejectedError,
  LiveReadOnlyClient,
  type LiveReadOnlyClientOptions,
} from "../../src/live/live-read-only-client.js";
import { liveReadOnlyAllowlist } from "../../src/live/allowlist.js";
import { defaultTransportPolicy } from "../../src/live/policy.js";
import type { TransportPolicy } from "../../src/live/policy.js";
import {
  FakeTransport,
  createHangingResponder,
  exchange,
  type FakeTransportOptions,
} from "../support/fake-transport.js";

/**
 * These tests use the public `LiveReadOnlyClient.create()` API. The live
 * trust boundary must come from canonical generated manifest/registry data
 * inside the production module, not from caller-provided fixtures.
 */

const READ_ID = "cli.sys.version"; // a real seed id from liveReadOnlyAllowlist
const OTHER_ALLOWLISTED_ID = "cli.show.status";

const SYS_VERSION_SAMPLE = `Router Model: Vigor3912S    Version: 4.3.5 zh_TW zh_CN
Profile version: 4.0.7    Status: 1 (0x14bc0da9)
Router IP: 192.168.1.1    Netmask: 255.255.255.0
Firmware Build Date/Time: Nov 13 2023 16:38:20
Router Name: DrayTek
Revision: 3682_4564_a39c288 V400_RD3`;

function fixtureOperation(
  overrides: Partial<TypedOperation<never, unknown>> = {},
): TypedOperation<never, unknown> {
  return {
    manifestId: READ_ID,
    classification: "read",
    buildFrames: () => [frameSingleCommand("sys version")],
    parse: (exchanges) => (exchanges[0] as { stdout: string } | undefined)?.stdout,
    ...overrides,
  };
}

interface SpyTransportHandle {
  readonly transport: FakeTransport;
  readonly send: MockInstance<FakeTransport["send"]>;
  readonly close: MockInstance<FakeTransport["close"]>;
  readonly isOpenSpy: MockInstance<() => boolean>;
}

/**
 * Wraps the shared `FakeTransport` (`tests/support/fake-transport.ts`, Wave 1
 * Lane C's C4) with spies on `send`, `close`, and the `isOpen` getter, per
 * this task's requirement to prove guard failures never touch the
 * transport.
 */
function createSpyTransport(
  response: TransportExchange = { stdout: SYS_VERSION_SAMPLE, stderr: "" },
  options: FakeTransportOptions = {},
): SpyTransportHandle {
  const transport = new FakeTransport(
    options.responder === undefined && options.responses === undefined
      ? { responses: [response] }
      : options,
  );
  const send = vi.spyOn(transport, "send");
  const close = vi.spyOn(transport, "close");
  const isOpenSpy = vi.spyOn(transport, "isOpen", "get");

  return { transport, send, close, isOpenSpy };
}

interface ValidOptionsOverrides {
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly operationIds?: readonly string[];
  readonly transportPolicy?: TransportPolicy;
  readonly executionLimits?: ExecutionLimits;
}

function buildValidOptions(
  spy: SpyTransportHandle,
  overrides: ValidOptionsOverrides = {},
): LiveReadOnlyClientOptions {
  const options = {
    operationIds: overrides.operationIds ?? [READ_ID],
    transportPolicy: overrides.transportPolicy ?? defaultTransportPolicy,
    transport: spy.transport,
    env: overrides.env ?? { VIGOR_E2E_READ_ONLY: "true" },
  };

  if (overrides.executionLimits === undefined) {
    return options;
  }

  return {
    ...options,
    executionLimits: overrides.executionLimits,
  };
}

describe("LiveReadOnlyClient.create -- guard chain", () => {
  it("guard 1: rejects when VIGOR_E2E_READ_ONLY is missing, without touching the transport", () => {
    const spy = createSpyTransport();
    const options = buildValidOptions(spy, { env: {} });

    expect(() => LiveReadOnlyClient.create(options)).toThrow(LiveClientRejectedError);
    expect(spy.send).not.toHaveBeenCalled();
    expect(spy.isOpenSpy).not.toHaveBeenCalled();
    expect(spy.close).not.toHaveBeenCalled();
  });

  it('guard 1: rejects when VIGOR_E2E_READ_ONLY is not exactly "true"', () => {
    const spy = createSpyTransport();
    const options = buildValidOptions(spy, { env: { VIGOR_E2E_READ_ONLY: "TRUE" } });

    expect(() => LiveReadOnlyClient.create(options)).toThrow(/VIGOR_E2E_READ_ONLY/);
    expect(spy.send).not.toHaveBeenCalled();
  });

  it("guard 1: never reads any other environment variable", () => {
    const spy = createSpyTransport();
    const readKeys: string[] = [];
    const env = new Proxy<Record<string, string | undefined>>(
      { VIGOR_E2E_READ_ONLY: "true" },
      {
        get(target, key: string) {
          readKeys.push(key);
          return target[key];
        },
      },
    );
    const options = buildValidOptions(spy, { env });

    LiveReadOnlyClient.create(options);

    expect(readKeys).toEqual(["VIGOR_E2E_READ_ONLY"]);
  });

  it("guard 2: rejects an id that is not in liveReadOnlyAllowlist, without touching the transport", () => {
    const spy = createSpyTransport();
    const options = buildValidOptions(spy, {
      operationIds: ["cli.sys.reboot"],
    });

    expect(() => LiveReadOnlyClient.create(options)).toThrow(/liveReadOnlyAllowlist/);
    expect(spy.send).not.toHaveBeenCalled();
    expect(spy.isOpenSpy).not.toHaveBeenCalled();
  });

  it("guard 3: rejects a transport policy with a non-private-lan host kind, without touching the transport", () => {
    const spy = createSpyTransport();
    const badPolicy = {
      ...defaultTransportPolicy,
      allowedHostKinds: ["public-wan"],
    } as unknown as TransportPolicy;
    const options = buildValidOptions(spy, { transportPolicy: badPolicy });

    expect(() => LiveReadOnlyClient.create(options)).toThrow(/allowedHostKinds/);
    expect(spy.send).not.toHaveBeenCalled();
    expect(spy.isOpenSpy).not.toHaveBeenCalled();
  });

  it("guard 3: rejects a transport policy with agent forwarding enabled", () => {
    const spy = createSpyTransport();
    const badPolicy = {
      ...defaultTransportPolicy,
      allowAgentForwarding: true,
    } as unknown as TransportPolicy;
    const options = buildValidOptions(spy, { transportPolicy: badPolicy });

    expect(() => LiveReadOnlyClient.create(options)).toThrow(/allowAgentForwarding/);
    expect(spy.send).not.toHaveBeenCalled();
  });

  it("guard 3: rejects a transport policy with a non-positive port", () => {
    const spy = createSpyTransport();
    const badPolicy = { ...defaultTransportPolicy, port: 0 };
    const options = buildValidOptions(spy, { transportPolicy: badPolicy });

    expect(() => LiveReadOnlyClient.create(options)).toThrow(/port/);
    expect(spy.send).not.toHaveBeenCalled();
  });

  describe("guard 4: surface-safety assertion", () => {
    const dangerousMemberName = "__e3_test_write_method__";

    afterEach(() => {
      Reflect.deleteProperty(LiveReadOnlyClient.prototype, dangerousMemberName);
    });

    it("rejects construction if the class prototype ever grows an unexpected member", () => {
      (LiveReadOnlyClient.prototype as unknown as Record<string, unknown>)[dangerousMemberName] =
        function write() {
          return undefined;
        };

      const spy = createSpyTransport();
      const options = buildValidOptions(spy);

      expect(() => LiveReadOnlyClient.create(options)).toThrow(LiveClientRejectedError);
      expect(() => LiveReadOnlyClient.create(options)).toThrow(new RegExp(dangerousMemberName));
      expect(spy.send).not.toHaveBeenCalled();
    });
  });
});

describe("LiveReadOnlyClient -- constructed surface (runtime proof)", () => {
  it("exposes only the fixed read-only member names", () => {
    const spy = createSpyTransport();
    const client = LiveReadOnlyClient.create(buildValidOptions(spy));

    const prototypeMembers = Object.getOwnPropertyNames(
      Object.getPrototypeOf(client) as object,
    ).filter((name) => name !== "constructor");
    const ownMembers = Object.getOwnPropertyNames(client);

    expect(prototypeMembers.sort()).toEqual(["invoke", "listOperationIds"]);
    expect(ownMembers).toEqual([]);
  });

  it("listOperationIds only ever returns ids that were requested and passed every guard", () => {
    const spy = createSpyTransport();
    const client = LiveReadOnlyClient.create(buildValidOptions(spy));

    expect(client.listOperationIds()).toEqual([READ_ID]);
  });

  it("invoke() rejects an id that was never requested at construction, without touching the transport", async () => {
    const spy = createSpyTransport();
    const client = LiveReadOnlyClient.create(buildValidOptions(spy));

    await expect(client.invoke(OTHER_ALLOWLISTED_ID)).rejects.toThrow(LiveClientRejectedError);
    expect(spy.send).not.toHaveBeenCalled();
  });

  it("invoke() rejects an id that is not even in liveReadOnlyAllowlist", async () => {
    const spy = createSpyTransport();
    const client = LiveReadOnlyClient.create(buildValidOptions(spy));

    await expect(client.invoke("cli.sys.reboot")).rejects.toThrow(LiveClientRejectedError);
    expect(spy.send).not.toHaveBeenCalled();
  });

  it("has no write-capable member at the type level (compile-time proof via @ts-expect-error)", () => {
    const spy = createSpyTransport();
    const client = LiveReadOnlyClient.create(buildValidOptions(spy));

    // @ts-expect-error LiveReadOnlyClient must not expose a raw `execute` method.
    const attemptExecute = (): unknown => client.execute;
    // @ts-expect-error LiveReadOnlyClient must not expose a runner accessor.
    const attemptRunner = (): unknown => client.runner;
    // @ts-expect-error LiveReadOnlyClient must not expose the underlying transport.
    const attemptTransport = (): unknown => client.transport;

    // None of these are ever called -- this test only proves, at compile
    // time, that the properties do not exist on the declared type.
    expect(typeof attemptExecute).toBe("function");
    expect(typeof attemptRunner).toBe("function");
    expect(typeof attemptTransport).toBe("function");
    expect(spy.send).not.toHaveBeenCalled();
  });
});

describe("LiveReadOnlyClient -- happy path", () => {
  it("dispatches an allowlisted read operation through the injected fake transport", async () => {
    const spy = createSpyTransport();
    const client = LiveReadOnlyClient.create(buildValidOptions(spy));

    const result = await client.invoke(READ_ID);

    expect(result).toMatchObject({ routerModel: "Vigor3912S", version: "4.3.5 zh_TW zh_CN" });
    expect(spy.send).toHaveBeenCalledTimes(1);
    const [frame] = spy.send.mock.calls[0] ?? [];
    expect(frame?.command).toBe("sys version");
  });

  it("ignores caller-provided manifest and registry objects, so a forged write frame cannot dispatch", async () => {
    const spy = createSpyTransport();
    const forgedOptions = {
      ...buildValidOptions(spy),
      manifest: [
        {
          id: READ_ID,
          classification: "read",
          status: "implemented",
        },
      ],
      registry: new Map([
        [
          READ_ID,
          fixtureOperation({
            buildFrames: () => [frameSingleCommand("sys reboot")],
          }),
        ],
      ]),
    } as unknown as LiveReadOnlyClientOptions;
    const client = LiveReadOnlyClient.create(forgedOptions);

    await client.invoke(READ_ID);

    expect(spy.send).toHaveBeenCalledTimes(1);
    const [frame] = spy.send.mock.calls[0] ?? [];
    expect(frame?.command).toBe("sys version");
    expect(frame?.command).not.toBe("sys reboot");
  });

  it("routes invoke() through the runner envelope, so commandTimeoutMs is enforced", async () => {
    vi.useFakeTimers();
    try {
      const spy = createSpyTransport(undefined, { responder: createHangingResponder() });
      const client = LiveReadOnlyClient.create(
        buildValidOptions(spy, {
          executionLimits: {
            ...defaultExecutionLimits,
            commandTimeoutMs: 50,
          },
        }),
      );

      const resultPromise = client.invoke(READ_ID);
      const assertion = expect(resultPromise).rejects.toMatchObject({
        code: sdkErrorCodes.executionTimeout,
      });

      await vi.advanceTimersByTimeAsync(50);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("routes invoke() through the runner envelope, so output overflow closes the session", async () => {
    const spy = createSpyTransport(undefined, { responses: [exchange("x".repeat(20))] });
    const client = LiveReadOnlyClient.create(
      buildValidOptions(spy, {
        executionLimits: {
          ...defaultExecutionLimits,
          maxOutputBytes: 10,
        },
      }),
    );

    await expect(client.invoke(READ_ID)).rejects.toMatchObject({
      code: sdkErrorCodes.outputLimitExceeded,
    });
    expect(spy.transport.isOpen).toBe(false);
    expect(spy.transport.closeReason).toBe("output_limit_exceeded");

    await expect(client.invoke(READ_ID)).rejects.toMatchObject({
      code: sdkErrorCodes.sessionClosed,
    });
  });

  it("serializes concurrent invoke() calls through the same session queue", async () => {
    const order: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstExchange = new Promise<TransportExchange>((resolve) => {
      releaseFirst = () => {
        resolve(exchange("first"));
      };
    });
    const spy = createSpyTransport(undefined, {
      responder: (frame) => {
        order.push(`start:${frame.command}`);
        if (order.length === 1) {
          return firstExchange;
        }
        order.push(`end:${frame.command}`);
        return exchange("second");
      },
    });
    const client = LiveReadOnlyClient.create(buildValidOptions(spy));

    const first = client.invoke(READ_ID);
    const second = client.invoke(READ_ID);
    await Promise.resolve();

    expect(spy.send).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["start:sys version"]);

    releaseFirst?.();
    await Promise.all([first, second]);
    expect(spy.send).toHaveBeenCalledTimes(2);
    expect(order).toEqual(["start:sys version", "start:sys version", "end:sys version"]);
  });
});

describe("liveReadOnlyAllowlist sanity (used by the fixtures above)", () => {
  it("contains both seed ids this test file relies on", () => {
    expect(liveReadOnlyAllowlist).toContain(READ_ID);
    expect(liveReadOnlyAllowlist).toContain(OTHER_ALLOWLISTED_ID);
  });
});
