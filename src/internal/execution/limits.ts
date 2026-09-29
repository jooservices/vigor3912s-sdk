import { Vigor3912SError, sdkErrorCodes } from "../../errors.js";

/**
 * Execution limits (`ARCHITECTURE.md`, "Item 3", numeric values from the
 * "Resolved decisions log" -- root/user approved, final).
 */

export interface ExecutionLimits {
  /** Maximum UTF-8 bytes accepted for one framed command. */
  readonly maxCommandBytes: number;
  /** Maximum wall-clock time for one command exchange. */
  readonly commandTimeoutMs: number;
  /** Maximum idle time with no new output bytes during an exchange. */
  readonly idleTimeoutMs: number;
  /** Maximum combined stdout/stderr bytes accepted before the runner closes. */
  readonly maxOutputBytes: number;
}

export const defaultExecutionLimits: ExecutionLimits = {
  maxCommandBytes: 1024,
  commandTimeoutMs: 15_000,
  idleTimeoutMs: 5_000,
  maxOutputBytes: 4 * 1024 * 1024,
};

export interface ResolveLimitsOptions {
  readonly timeoutMs?: number;
}

/** Largest delay `setTimeout` honors; longer values fire immediately. */
const MAX_TIMER_MS = 2_147_483_647;

function invalidOptions(message: string): Vigor3912SError {
  return new Vigor3912SError(sdkErrorCodes.invalidOptions, message);
}

function assertLimitValue(value: number, name: string, max = Number.MAX_SAFE_INTEGER): void {
  if (!Number.isInteger(value) || value <= 0 || value > max) {
    throw invalidOptions(`${name} must be a positive integer no greater than ${String(max)}.`);
  }
}

/** Rejects limits that would silently disable a guard (NaN, 0, negative, overflow). */
export function assertExecutionLimits(limits: ExecutionLimits): void {
  assertLimitValue(limits.maxCommandBytes, "maxCommandBytes");
  assertLimitValue(limits.commandTimeoutMs, "commandTimeoutMs", MAX_TIMER_MS);
  assertLimitValue(limits.idleTimeoutMs, "idleTimeoutMs", MAX_TIMER_MS);
  assertLimitValue(limits.maxOutputBytes, "maxOutputBytes");
}

/**
 * Resolves the effective limits for one command: `override` (a typed
 * operation's registry-defined `executionOverride`, e.g. the `ip ping` /
 * `ip tracert` diagnostic ceiling) replaces defaults, then the caller's
 * `options.timeoutMs` may only lower `commandTimeoutMs`, never raise it.
 */
export function resolveLimits(
  defaults: ExecutionLimits,
  options?: ResolveLimitsOptions,
  override: Partial<ExecutionLimits> = {},
): ExecutionLimits {
  const merged: ExecutionLimits = { ...defaults, ...override };
  assertExecutionLimits(merged);

  const timeoutMs = options?.timeoutMs;

  if (timeoutMs === undefined) {
    return merged;
  }

  assertLimitValue(timeoutMs, "timeoutMs", MAX_TIMER_MS);

  return { ...merged, commandTimeoutMs: Math.min(merged.commandTimeoutMs, timeoutMs) };
}
