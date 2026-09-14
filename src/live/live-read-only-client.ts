/**
 * `LiveReadOnlyClient` + pre-connect guard chain (Wave 3 E3,
 * `ARCHITECTURE.md` "Item 4 — transport/session policy and
 * `LiveReadOnlyClient`"; `HANDOVER.md`'s non-negotiable safety boundary).
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
 * **`Transport`'s actual shape has no `connect()` method** (`isOpen`,
 * `send`, `close` only — see `internal/execution/transport.ts`, Wave 1 Lane
 * C's C4). This module therefore treats "before connecting" as "before the
 * transport is ever used to `send` anything": every guard in `create()`
 * runs, and can throw, before `#transport` is stored on the returned
 * instance is ever read or called. `create()` never calls `.send`,
 * `.isOpen`, or `.close` on the injected transport; only a later, separate
 * `invoke()` call (after successful construction) does.
 */

import { Vigor3912SError, sdkErrorCodes } from "../errors.js";
import { DefaultCommandRunner } from "../internal/execution/default-runner.js";
import { defaultExecutionLimits, type ExecutionLimits } from "../internal/execution/limits.js";
import type { Transport } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { operationRegistry } from "../internal/registry/registry.generated.js";
import type { CapabilityEntry } from "../manifest/types.js";
import { capabilityManifest } from "../manifest/index.js";
import { liveReadOnlyAllowlist } from "./allowlist.js";
import type { TransportPolicy } from "./policy.js";

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
  /** Injected `Transport` port; never touched unless every guard passes. */
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

  private constructor(
    operations: ReadonlyMap<string, TypedOperation<never, unknown>>,
    transport: Transport,
    limits: ExecutionLimits,
  ) {
    this.#operations = operations;
    this.#runner = new DefaultCommandRunner(transport, limits);
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

    const frames = operation.buildFrames(undefined as never);
    const exchanges = [];

    for (const frame of frames) {
      const result = await this.#runner.runWithOverride(
        frame.command,
        operation.executionOverride ?? {},
      );
      exchanges.push({ stdout: result.stdout, stderr: result.stderr });
    }

    return operation.parse(exchanges);
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

    // Guard 3: transport policy host-kind/shape check (structural only --
    // there is no real transport to probe yet).
    assertHostPolicy(options.transportPolicy);

    const client = new LiveReadOnlyClient(
      operations,
      options.transport,
      options.executionLimits ?? defaultExecutionLimits,
    );

    // Guard 4: the constructed surface must expose nothing beyond the fixed
    // read-only member allowlist.
    assertSurfaceIsReadOnly(client);

    return client;
  }
}
