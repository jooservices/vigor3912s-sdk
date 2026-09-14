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

/**
 * Resolves the effective limits for the raw wrapper only. `options.timeoutMs`
 * (caller-supplied) may only lower `commandTimeoutMs`; it can never raise it
 * above `defaults.commandTimeoutMs`. The `ip ping`/`ip tracert` diagnostic
 * exception is a separate, registry-defined mechanism
 * (`DefaultCommandRunner#runWithOverride`) -- it never flows through this
 * function or through `ExecuteOptions`.
 */
export function resolveLimits(
  defaults: ExecutionLimits,
  options?: ResolveLimitsOptions,
): ExecutionLimits {
  if (options?.timeoutMs === undefined) {
    return defaults;
  }

  return {
    ...defaults,
    commandTimeoutMs: Math.min(defaults.commandTimeoutMs, options.timeoutMs),
  };
}
