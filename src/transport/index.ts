/**
 * Public `Transport` contract (`ARCHITECTURE.md`, "Amendment 2026-09-14",
 * "Item 3"). This is the wire contract an external transport implementor
 * (e.g. an SSH client package such as `vigor3912s-client`) implements and
 * hands to `Vigor3912SClient.fromTransport()`. This SDK never implements
 * SSH or any real network transport itself -- `internal/execution/*` only
 * consumes this interface, it never constructs a concrete implementation.
 *
 * `CommandFrame` is re-exported as a type only: implementors receive frames
 * from this SDK's own framing (`internal/execution/framing.ts`) via
 * `Transport.send()`'s parameter; they never construct one themselves, so
 * `frameSingleCommand` is deliberately not exposed here.
 *
 * `ExecutionLimits` is also re-exported so `Transport.send()`'s public
 * signature is fully nameable without importing from `internal/`.
 */

export type {
  CommandExchange,
  Transport,
  TransportExchange,
} from "../internal/execution/transport.js";
export type { CommandFrame } from "../internal/execution/framing.js";
export type { ExecutionLimits } from "../internal/execution/limits.js";
