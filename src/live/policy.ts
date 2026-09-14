/**
 * Declarative transport/session policy shapes for the future live read-only
 * client.
 *
 * Type-only design intent (per `ARCHITECTURE.md` "Item 4 — transport/session
 * policy and `LiveReadOnlyClient`"): unsafe values are made unrepresentable
 * via literal types rather than relying on a runtime check alone.
 *
 * - `allowedHostKinds` is fixed to the literal tuple `readonly ["private-lan"]`
 *   (not `readonly string[]`), matching the LAN-only safety rule from
 *   `operations.md`.
 * - `allowAgentForwarding` is fixed to the literal type `false` (not
 *   `boolean`).
 * - `maxConcurrentCommands` is fixed to the literal type `1` (not `number`).
 *
 * None of these three fields is configurable. A future edit that widens any
 * of them is a visible type change to this file, not a silent value change
 * elsewhere.
 *
 * This module is pure data/types: no connection, transport, or execution
 * logic. It does not implement `LiveReadOnlyClient` (Item 4 / Wave 3 E3) or
 * the allowlist (Wave 3 E2).
 */

export interface TransportPolicy {
  /** LAN-only (operations.md safety rule); not configurable. */
  readonly allowedHostKinds: readonly ["private-lan"];
  readonly port: number;
  readonly connectTimeoutMs: number;
  /** Never allowed; not configurable. */
  readonly allowAgentForwarding: false;
}

export interface SessionPolicy {
  /** Serialized single-command sessions only; not configurable. */
  readonly maxConcurrentCommands: 1;
  readonly idleTimeoutMs: number;
  readonly maxSessionMs: number;
}

/**
 * Default transport policy.
 *
 * - `port: 22` — SSH default, matches `projects/vigor3912s-mcp/.env.example`'s
 *   `VIGOR_PORT=22`.
 * - `connectTimeoutMs: 15_000` — consistent with the approved `execute()`
 *   envelope's `commandTimeoutMs` (Item 3), which uses 15s as the single-
 *   command ceiling; establishing a LAN SSH connection should complete well
 *   within that, so the same conservative bound is reused rather than
 *   inventing a new number.
 */
export const defaultTransportPolicy: TransportPolicy = {
  allowedHostKinds: ["private-lan"],
  port: 22,
  connectTimeoutMs: 15_000,
  allowAgentForwarding: false,
};

/**
 * Default session policy.
 *
 * - `idleTimeoutMs: 5_000` — matches the approved `execute()` envelope's
 *   `idleTimeoutMs` (Item 3): no new output bytes for 5s ends the exchange.
 * - `maxSessionMs: 300_000` (5 minutes) — a conservative overall session cap
 *   for the future read-only client; well above any single bounded command
 *   exchange (15s) or the `ip ping`/`ip tracert` diagnostic ceiling (60s), but
 *   short enough that a stuck or forgotten LAN session cannot run unbounded.
 */
export const defaultSessionPolicy: SessionPolicy = {
  maxConcurrentCommands: 1,
  idleTimeoutMs: 5_000,
  maxSessionMs: 300_000,
};
