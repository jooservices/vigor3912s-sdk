/**
 * `LiveReadOnlyClient` + pre-connect guard chain (Wave 3 E3,
 * `ARCHITECTURE.md` "Item 4 — transport/session policy and
 * `LiveReadOnlyClient`"; project safety boundary).
 *
 * **Explicit stop, same as the architecture and backlog entry for this
 * task**: this module ends at guard chain + derived read-only surface +
 * fake-transport tests. It does not implement, choose, or reference a real
 * SSH/network transport; it never calls a real `connect()`; it never reads
 * `.env` file contents (it checks exactly one `process.env` flag's value,
 * nothing else); and it never references `projects/vigor3912s-mcp/.env`. No
 * E2E or live-router connection work begins here — that needs separate,
 * explicit user authorization requested at that time.
 *
 * **Two independent keys gate every id this client can expose** (per
 * `ARCH#Item-4`): (a) the id's generated-manifest entry has
 * `classification: "read"` **and** `status: "implemented"`, and (b) the id
 * appears in the hand-maintained `liveReadOnlyAllowlist` (`./allowlist.js`).
 * Neither source alone can widen live reach. The generated manifest and
 * self-assembled operation registry are complete for CLI operations now, so
 * `create()` uses those canonical module imports directly instead of trusting
 * caller-supplied manifest/registry objects. A third, defense-in-depth check
 * is added here: the *registry* entry backing that id must itself be
 * `classification: "read"` too, so a mismatched registration (e.g. a write
 * operation accidentally registered under an id whose manifest entry happens
 * to say "read") cannot become reachable through this client either.
 *
 * **Surface shape**: the architecture's target shape is
 * `Pick<ReadOperationsMap, LiveReadOnlyId>` — a named method per documented
 * read operation. The current public surface remains deliberately generic:
 * `invoke(id)` only resolves against a frozen, internal map built once in
 * `create()` from canonical operations that already passed every gate above.
 * `id` is a plain `string` parameter, not a raw command; passing any id that
 * did not pass every gate at construction time rejects with
 * `LiveClientRejectedError` before runner dispatch. There is no `execute`, no
 * runner/transport accessor, and no way to reach a non-allowlisted or
 * non-read operation, not even indirectly.
 *
 * **`Transport` has no `connect()` method**, so "before connecting" means
 * "before the transport is ever used": every guard in `create()` runs, and
 * can throw, without calling `send`, `stream`, `isOpen` or `close`. `create()`
 * reads only `remoteEndpoint` to bind the LAN-only policy to the real peer;
 * a later `invoke()` re-checks it and is the only path that sends.
 */

import { Vigor3912SError, sdkErrorCodes } from "../errors.js";
import { DefaultCommandRunner } from "../internal/execution/default-runner.js";
import { runOperation } from "../internal/execution/run-operation.js";
import { defaultExecutionLimits, type ExecutionLimits } from "../internal/execution/limits.js";
import type { Transport } from "../internal/execution/transport.js";
import { isIP } from "node:net";
import type { TypedOperation } from "../internal/registry/operation.js";
import { operationRegistry } from "../internal/registry/registry.generated.js";
import type { CapabilityEntry } from "../manifest/types.js";
import { capabilityManifest } from "../manifest/index.js";
import { liveReadOnlyAllowlist } from "./allowlist.js";
import { defaultSessionPolicy, type SessionPolicy, type TransportPolicy } from "./policy.js";

export class LiveClientRejectedError extends Vigor3912SError {
  public constructor(message: string) {
    super(sdkErrorCodes.liveClientRejected, message);
    this.name = "LiveClientRejectedError";
  }
}

export interface LiveReadOnlyClientOptions {
  /** Ids the caller wants exposed; every one must independently pass guard 2. */
  readonly operationIds: readonly string[];
  readonly transportPolicy: TransportPolicy;
  /** Defaults to `defaultSessionPolicy`: idle timeout per command + overall session lifetime. */
  readonly sessionPolicy?: SessionPolicy;
  /**
   * Injected `Transport` port; never sent a command unless every guard
   * passes. Must expose `remoteEndpoint` (the connected peer's IP and port):
   * the LAN-only policy is bound to that endpoint, not to caller claims.
   */
  readonly transport: Transport;
  readonly executionLimits?: ExecutionLimits;
  /**
   * Defaults to `process.env`. Only `VIGOR_E2E_READ_ONLY` is ever read from
   * it — never any credential or host/port variable. Tests inject a minimal
   * fake object here instead of mutating the real process environment.
   */
  readonly env?: Readonly<Record<string, string | undefined>>;
}

/**
 * The only members `LiveReadOnlyClient` instances may ever expose (own or
 * inherited from its prototype, excluding `constructor`). Guard 4 fails
 * closed if this class ever grows a member outside this set.
 */
const SURFACE_MEMBER_ALLOWLIST: ReadonlySet<string> = new Set(["invoke", "listOperationIds"]);

function indexManifestById(
  manifest: readonly CapabilityEntry[],
): ReadonlyMap<string, CapabilityEntry> {
  return new Map(manifest.map((entry) => [entry.id, entry] as const));
}

function assertHostPolicy(policy: TransportPolicy): void {
  const kinds: readonly unknown[] = policy.allowedHostKinds;

  if (kinds.length !== 1 || kinds[0] !== "private-lan") {
    throw new LiveClientRejectedError(
      'TransportPolicy.allowedHostKinds must be exactly ["private-lan"].',
    );
  }

  // `allowAgentForwarding` is typed as the literal `false`, but this is a
  // runtime defense against a malformed/force-cast policy object -- read it
  // through `unknown` so the type system's literal narrowing does not hide
  // a genuine runtime mismatch.
  const allowAgentForwarding: unknown = policy.allowAgentForwarding;
  if (allowAgentForwarding !== false) {
    throw new LiveClientRejectedError("TransportPolicy.allowAgentForwarding must be false.");
  }

  if (!Number.isInteger(policy.port) || policy.port <= 0) {
    throw new LiveClientRejectedError("TransportPolicy.port must be a positive integer.");
  }
}

function ipv4Octets(address: string): readonly number[] {
  return address.split(".").map(Number);
}

/** RFC 1918 private IPv4, IPv4 link-local, IPv6 unique-local (fc00::/7) or link-local (fe80::/10). */
export function isPrivateLanAddress(address: string): boolean {
  const version = isIP(address);

  if (version === 4) {
    const [a = -1, b = -1] = ipv4Octets(address);

    return (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    );
  }

  if (version === 6) {
    const lowered = address.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lowered)?.[1];

    if (mapped !== undefined) {
      return isPrivateLanAddress(mapped);
    }

    // Only a full first hextet can be fc00::/7 or fe80::/10 (`fc::1` is 00fc::).
    return /^f[cd][0-9a-f]{2}:/.test(lowered) || /^fe[89ab][0-9a-f]:/.test(lowered);
  }

  return false;
}

/**
 * Guard 3b (re-run before every command): the transport's actual peer must
 * be a private-LAN IP literal on the policy port. Binds the declarative
 * `allowedHostKinds: ["private-lan"]` to what the transport really reaches.
 */
function assertEndpointPolicy(transport: Transport, policy: TransportPolicy): void {
  const endpoint = transport.remoteEndpoint;

  if (endpoint === undefined) {
    throw new LiveClientRejectedError(
      "Transport.remoteEndpoint is required so the LAN-only policy can verify the real peer.",
    );
  }

  if (isIP(endpoint.address) === 0) {
    throw new LiveClientRejectedError(
      "Transport.remoteEndpoint.address must be the resolved peer IP, not a hostname.",
    );
  }

  if (!isPrivateLanAddress(endpoint.address)) {
    throw new LiveClientRejectedError(
      "Transport.remoteEndpoint.address is not a private-LAN address; refusing a non-LAN peer.",
    );
  }

  if (endpoint.port !== policy.port) {
    throw new LiveClientRejectedError(
      `Transport.remoteEndpoint.port does not match TransportPolicy.port (${String(policy.port)}).`,
    );
  }
}

function assertSessionPolicy(policy: SessionPolicy): void {
  const maxConcurrentCommands: unknown = policy.maxConcurrentCommands;

  if (maxConcurrentCommands !== 1) {
    throw new LiveClientRejectedError("SessionPolicy.maxConcurrentCommands must be 1.");
  }

  for (const [name, value] of [
    ["idleTimeoutMs", policy.idleTimeoutMs],
    ["maxSessionMs", policy.maxSessionMs],
  ] as const) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new LiveClientRejectedError(`SessionPolicy.${name} must be a positive integer.`);
    }
  }
}

/**
 * Guard 4: walks the instance's own property names and its prototype's own
 * property names (excluding `constructor`) and rejects if anything outside
 * `SURFACE_MEMBER_ALLOWLIST` is found. Private class fields (`#operations`,
 * `#runner`) never appear in either list, by language design.
 */
function assertSurfaceIsReadOnly(instance: object): void {
  const prototype = Object.getPrototypeOf(instance) as object;
  const prototypeMembers = Object.getOwnPropertyNames(prototype).filter(
    (name) => name !== "constructor",
  );
  const ownMembers = Object.getOwnPropertyNames(instance);

  for (const member of [...prototypeMembers, ...ownMembers]) {
    if (!SURFACE_MEMBER_ALLOWLIST.has(member)) {
      throw new LiveClientRejectedError(
        `LiveReadOnlyClient surface exposes unexpected member "${member}"; refusing to construct.`,
      );
    }
  }
}

export class LiveReadOnlyClient {
  readonly #operations: ReadonlyMap<string, TypedOperation<never, unknown>>;
  readonly #runner: DefaultCommandRunner;
  readonly #transport: Transport;
  readonly #transportPolicy: TransportPolicy;
  readonly #expiresAt: number;

  private constructor(
    operations: ReadonlyMap<string, TypedOperation<never, unknown>>,
    transport: Transport,
    transportPolicy: TransportPolicy,
    sessionPolicy: SessionPolicy,
    limits: ExecutionLimits,
  ) {
    this.#operations = operations;
    this.#transport = transport;
    this.#transportPolicy = transportPolicy;
    this.#expiresAt = Date.now() + sessionPolicy.maxSessionMs;
    this.#runner = new DefaultCommandRunner(transport, {
      ...limits,
      idleTimeoutMs: Math.min(limits.idleTimeoutMs, sessionPolicy.idleTimeoutMs),
    });
    Object.freeze(this);
  }

  /** Ids exposed by this instance -- always a subset of ids that passed every guard. */
  public listOperationIds(): readonly string[] {
    return [...this.#operations.keys()];
  }

  /**
   * Dispatches a single already-double-gated read operation through the
   * injected transport. Rejects before runner dispatch for any id
   * that did not pass every `create()` guard, including ids that are
   * syntactically valid manifest/allowlist ids but were simply never
   * requested at construction time.
   */
  public async invoke(id: string): Promise<unknown> {
    const operation = this.#operations.get(id);

    if (operation === undefined) {
      throw new LiveClientRejectedError(
        `Operation "${id}" is not available on this read-only client.`,
      );
    }

    if (Date.now() >= this.#expiresAt) {
      await this.#runner.close("max_session_exceeded");
      throw new LiveClientRejectedError(
        "SessionPolicy.maxSessionMs elapsed; this read-only client is closed.",
      );
    }

    // The transport may have reconnected since create(): re-bind the policy.
    assertEndpointPolicy(this.#transport, this.#transportPolicy);

    return runOperation(this.#runner, operation, undefined as never);
  }

  /**
   * The only way to obtain a `LiveReadOnlyClient`. Runs the full pre-connect
   * guard chain, in order, before returning -- every guard failure throws
   * `LiveClientRejectedError` and never calls `.send`/`.isOpen`/`.close` on
   * `options.transport`.
   */
  public static create(options: LiveReadOnlyClientOptions): LiveReadOnlyClient {
    const env = options.env ?? process.env;

    // Guard 1: the E2E read-only flag must be present and exactly "true".
    if (env.VIGOR_E2E_READ_ONLY !== "true") {
      throw new LiveClientRejectedError(
        'VIGOR_E2E_READ_ONLY must be exactly "true" to construct a LiveReadOnlyClient.',
      );
    }

    // Guard 2: every requested id must be allowlisted AND read-classified,
    // cross-checked against the canonical generated manifest and registry.
    // The public API deliberately does not accept caller-supplied manifest or
    // registry data: live policy must never trust test fixtures or consumer
    // objects for its safety boundary.
    const manifestIndex = indexManifestById(capabilityManifest);
    const operations = new Map<string, TypedOperation<never, unknown>>();

    for (const id of options.operationIds) {
      if (!liveReadOnlyAllowlist.includes(id)) {
        throw new LiveClientRejectedError(
          `Operation id "${id}" is not present in liveReadOnlyAllowlist.`,
        );
      }

      const manifestEntry = manifestIndex.get(id);
      if (manifestEntry === undefined || manifestEntry.classification !== "read") {
        throw new LiveClientRejectedError(
          `Operation id "${id}" does not have manifest classification "read".`,
        );
      }
      if (manifestEntry.status !== "implemented") {
        throw new LiveClientRejectedError(
          `Operation id "${id}" does not have manifest status "implemented".`,
        );
      }

      const operation = operationRegistry.get(id);
      if (operation === undefined || operation.classification !== "read") {
        throw new LiveClientRejectedError(
          `Operation id "${id}" has no read-classified registry entry.`,
        );
      }

      operations.set(id, operation);
    }

    // Guard 3: policy shape, then the transport's real endpoint against it.
    assertHostPolicy(options.transportPolicy);
    const sessionPolicy = options.sessionPolicy ?? defaultSessionPolicy;
    assertSessionPolicy(sessionPolicy);
    assertEndpointPolicy(options.transport, options.transportPolicy);

    const client = new LiveReadOnlyClient(
      operations,
      options.transport,
      options.transportPolicy,
      sessionPolicy,
      options.executionLimits ?? defaultExecutionLimits,
    );

    // Guard 4: the constructed surface must expose nothing beyond the fixed
    // read-only member allowlist.
    assertSurfaceIsReadOnly(client);

    return client;
  }
}
