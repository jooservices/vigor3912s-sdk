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
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseSet } from "../internal/parsers/vigbrg/set.js";
import { parseStatus, type VigbrgStatusReport } from "../internal/parsers/vigbrg/status.js";
import { parseWanStatus } from "../internal/parsers/vigbrg/wanstatus.js";
import { parseWlanStatus } from "../internal/parsers/vigbrg/wlanstatus.js";
import { parseCloseall } from "../internal/parsers/vigbrg/closeall.js";
import { parseCfgip } from "../internal/parsers/vigbrg/cfgip.js";
import type { RawCommandOutput, VigbrgMacTableReport } from "../internal/parsers/vigbrg/shared.js";
import {
  assertIntegerInRange,
  assertIpv4,
  assertOneOf,
  firstExchangeText,
} from "../internal/domain-support.js";

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
