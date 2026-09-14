/**
 * `vigbrg` domain -- Wave 4 Item5-vigbrg (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements all classified `cli.vigbrg.*` manifest entries, including the
 * previously deferred `cli.vigbrg.closeall` and `cli.vigbrg.cfgip` writes.
 *
 * Every `buildFrames` validates its input before calling
 * `frameSingleCommand` -- `frameSingleCommand` itself only rejects framing
 * hazards (control chars, shell metacharacters, empty input), it has no
 * notion of a command's own documented argument shape. Validation failures
 * throw a plain `Error` (this family's write scope excludes `src/errors.ts`,
 * so no new `SdkErrorCode` is introduced here).
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/vigbrg/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseSet } from "../internal/parsers/vigbrg/set.js";
import { parseStatus, type VigbrgStatusReport } from "../internal/parsers/vigbrg/status.js";
import { parseWanStatus } from "../internal/parsers/vigbrg/wanstatus.js";
import { parseWlanStatus } from "../internal/parsers/vigbrg/wlanstatus.js";
import { parseCloseall } from "../internal/parsers/vigbrg/closeall.js";
import { parseCfgip } from "../internal/parsers/vigbrg/cfgip.js";
import type { RawCommandOutput, VigbrgMacTableReport } from "../internal/parsers/vigbrg/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer (got ${String(value)}).`);
  }
}

function assertIntegerInRange(value: number, min: number, max: number, name: string): void {
  assertInteger(value, name);

  if (value < min || value > max) {
    throw new Error(
      `${name} must be between ${String(min)} and ${String(max)} (got ${String(value)}).`,
    );
  }
}

/**
 * Generic runtime membership check for narrow string/number-literal-union
 * inputs, mirroring the sibling `wan` domain's own `assertOneOf`
 * (`src/domains/wan.ts`) -- declared generically rather than as direct
 * `!==` comparisons so `@typescript-eslint/no-unnecessary-condition` doesn't
 * flag it as statically-impossible for well-typed callers, while still
 * validating callers (plain-JS, tests) that don't honor the literal type.
 */
function assertOneOf<T>(value: T, allowed: readonly T[], name: string): void {
  if (!allowed.includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => JSON.stringify(entry)).join(", ")} (got ${JSON.stringify(value)}).`,
    );
  }
}

const SINGLE_CLI_TOKEN_PATTERN = /^\S+$/;

function assertSingleToken(value: string, name: string): void {
  if (!SINGLE_CLI_TOKEN_PATTERN.test(value)) {
    throw new Error(
      `${name} must be a single non-empty token with no whitespace (got "${value}").`,
    );
  }
}

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function assertIpv4(value: string, name: string): void {
  assertSingleToken(value, name);

  if (!IPV4_PATTERN.test(value)) {
    throw new Error(`${name} must be an IPv4 address (got "${value}").`);
  }
}

// ---------------------------------------------------------------------------
// cli.vigbrg.set -- `vigbrg set -v <4/6> -w <WAN_idx> -l <LAN_idx> -e <0/1>
// [-f <0/1>]` (rawLine 9249) -- write.
// ---------------------------------------------------------------------------

export interface VigbrgSetInput {
  readonly ipVersion: 4 | 6;
  readonly wanIndex: number;
  readonly lanIndex: number;
  readonly bridgeEnabled: boolean;
  readonly firewallEnabled?: boolean;
}

function buildSetFrames(input: VigbrgSetInput): readonly CommandFrame[] {
  assertOneOf(input.ipVersion, [4, 6], "ipVersion");
  assertIntegerInRange(input.wanIndex, 1, 10, "wanIndex");
  assertIntegerInRange(input.lanIndex, 1, 100, "lanIndex");

  const parts = [
    "vigbrg set",
    "-v",
    String(input.ipVersion),
    "-w",
    String(input.wanIndex),
    "-l",
    String(input.lanIndex),
    "-e",
    input.bridgeEnabled ? "1" : "0",
  ];

  if (input.firewallEnabled !== undefined) {
    parts.push("-f", input.firewallEnabled ? "1" : "0");
  }

  return [frameSingleCommand(parts.join(" "))];
}

export const vigbrgSet: TypedOperation<VigbrgSetInput, RawCommandOutput> = {
  manifestId: "cli.vigbrg.set",
  classification: "write",
  buildFrames: buildSetFrames,
  parse: (exchanges) => parseSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vigbrg.status -- `vigbrg status` (rawLine 9290) -- read.
// ---------------------------------------------------------------------------

function buildStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vigbrg status")];
}

export const vigbrgStatus: TypedOperation<void, VigbrgStatusReport> = {
  manifestId: "cli.vigbrg.status",
  classification: "read",
  buildFrames: buildStatusFrames,
  parse: (exchanges) => parseStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vigbrg.wanstatus -- `vigbrg wanstatus` (rawLine 9315) -- read.
// ---------------------------------------------------------------------------

function buildWanStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vigbrg wanstatus")];
}

export const vigbrgWanStatus: TypedOperation<void, VigbrgMacTableReport> = {
  manifestId: "cli.vigbrg.wanstatus",
  classification: "read",
  buildFrames: buildWanStatusFrames,
  parse: (exchanges) => parseWanStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vigbrg.wlanstatus -- `vigbrg wlanstatus` (rawLine 9326) -- read.
// ---------------------------------------------------------------------------

function buildWlanStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vigbrg wlanstatus")];
}

export const vigbrgWlanStatus: TypedOperation<void, VigbrgMacTableReport> = {
  manifestId: "cli.vigbrg.wlanstatus",
  classification: "read",
  buildFrames: buildWlanStatusFrames,
  parse: (exchanges) => parseWlanStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vigbrg.closeall -- `vigbrg closeall` (rawLine 9283) -- write.
// ---------------------------------------------------------------------------

function buildCloseallFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vigbrg closeall")];
}

export const vigbrgCloseall: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vigbrg.closeall",
  classification: "write",
  buildFrames: buildCloseallFrames,
  parse: (exchanges) => parseCloseall(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vigbrg.cfgip -- `vigbrg cfgip <IP Address>` (rawLine 9298) -- write.
// ---------------------------------------------------------------------------

export interface VigbrgCfgipInput {
  readonly ip: string;
}

function buildCfgipFrames(input: VigbrgCfgipInput): readonly CommandFrame[] {
  assertIpv4(input.ip, "ip");

  return [frameSingleCommand(`vigbrg cfgip ${input.ip}`)];
}

export const vigbrgCfgip: TypedOperation<VigbrgCfgipInput, RawCommandOutput> = {
  manifestId: "cli.vigbrg.cfgip",
  classification: "write",
  buildFrames: buildCfgipFrames,
  parse: (exchanges) => parseCfgip(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  vigbrgSet,
  vigbrgStatus,
  vigbrgWanStatus,
  vigbrgWlanStatus,
  vigbrgCloseall,
  vigbrgCfgip,
];
