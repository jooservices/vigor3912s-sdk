/**
 * `ddns` domain -- Wave 4 Item5-ddns (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the 4 already-classified `cli.ddns.*` manifest entries listed
 * in this task's assignment, all via `classificationBasis:
 * "sibling-live-verified"` (`vigor3912s-mcp`'s live-verified `ddns` family,
 * `src/commands/registry/families/ddns.ts`, consulted read-only as evidence,
 * never imported/depended on at runtime):
 *
 *  - `cli.ddns.enable` (write) -- `ddns enable [0/1]`
 *  - `cli.ddns.log` (read) -- `ddns log`
 *  - `cli.ddns.forceupdate` (write) -- `ddns forceupdate`
 *  - `cli.ddns.show` (read) -- `ddns show -i <value>`
 *
 * Also implements previously deferred writes: `cli.ddns.set` (YAGNI-narrowed
 * to the documented example flag set), `cli.ddns.time`, and
 * `cli.ddns.setdefault`.
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
 * `internal/parsers/ddns/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseEnable } from "../internal/parsers/ddns/enable.js";
import { parseForceUpdate } from "../internal/parsers/ddns/forceupdate.js";
import { parseLog } from "../internal/parsers/ddns/log.js";
import { parseShow, type DdnsShowAccount } from "../internal/parsers/ddns/show.js";
import { parseSet } from "../internal/parsers/ddns/set.js";
import { parseTime } from "../internal/parsers/ddns/time.js";
import { parseSetdefault } from "../internal/parsers/ddns/setdefault.js";
import type { RawCommandOutput } from "../internal/parsers/ddns/shared.js";

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

// ---------------------------------------------------------------------------
// cli.ddns.enable -- `ddns enable [0/1]` (rawLine 627) -- write
// ---------------------------------------------------------------------------

export interface DdnsEnableInput {
  readonly enabled: boolean;
}

function buildEnableFrames(input: DdnsEnableInput): readonly CommandFrame[] {
  return [frameSingleCommand(`ddns enable ${input.enabled ? "1" : "0"}`)];
}

export const ddnsEnable: TypedOperation<DdnsEnableInput, RawCommandOutput> = {
  manifestId: "cli.ddns.enable",
  classification: "write",
  buildFrames: buildEnableFrames,
  parse: (exchanges) => parseEnable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ddns.log -- `ddns log` (rawLine 749) -- read
// ---------------------------------------------------------------------------

function buildLogFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("ddns log")];
}

export const ddnsLog: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ddns.log",
  classification: "read",
  buildFrames: buildLogFrames,
  parse: (exchanges) => parseLog(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ddns.forceupdate -- `ddns forceupdate` (rawLine 773) -- write
// ---------------------------------------------------------------------------

function buildForceUpdateFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("ddns forceupdate")];
}

export const ddnsForceUpdate: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ddns.forceupdate",
  classification: "write",
  buildFrames: buildForceUpdateFrames,
  parse: (exchanges) => parseForceUpdate(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ddns.show -- `ddns show -i <value>` (rawLine 787) -- read
// ---------------------------------------------------------------------------

export interface DdnsShowInput {
  readonly accountIndex: number;
}

function buildShowFrames(input: DdnsShowInput): readonly CommandFrame[] {
  assertIntegerInRange(input.accountIndex, 1, 6, "accountIndex");

  return [frameSingleCommand(`ddns show -i ${String(input.accountIndex)}`)];
}

export const ddnsShow: TypedOperation<DdnsShowInput, DdnsShowAccount> = {
  manifestId: "cli.ddns.show",
  classification: "read",
  buildFrames: buildShowFrames,
  parse: (exchanges) => parseShow(firstExchangeText(exchanges)),
};

const SINGLE_CLI_TOKEN_PATTERN = /^\S+$/;

function assertSingleToken(value: string, name: string): void {
  if (!SINGLE_CLI_TOKEN_PATTERN.test(value)) {
    throw new Error(
      `${name} must be a single non-empty token with no whitespace (got "${value}").`,
    );
  }
}

function assertMaxLength(value: string, max: number, name: string): void {
  if (value.length > max) {
    throw new Error(
      `${name} must be at most ${String(max)} characters (got ${String(value.length)}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.ddns.set -- `ddns set option <value>` (rawLine 643) -- YAGNI: model the
// documented example flag set only (`-i/-S/-T/-D/-L/-P`). Remaining flags
// (`-E/-W/-C/-B/-M/-R/-H/-A/-a/-N/-O`) are deferred.
// ---------------------------------------------------------------------------

export interface DdnsSetInput {
  readonly accountIndex: number;
  readonly serviceProvider: number;
  readonly serviceType: number;
  readonly domainName: string;
  readonly loginName: string;
  readonly password: string;
}

function buildSetFrames(input: DdnsSetInput): readonly CommandFrame[] {
  assertIntegerInRange(input.accountIndex, 1, 6, "accountIndex");
  assertIntegerInRange(input.serviceProvider, 1, 19, "serviceProvider");
  assertIntegerInRange(input.serviceType, 1, 3, "serviceType");
  assertSingleToken(input.domainName, "domainName");
  assertMaxLength(input.domainName, 64, "domainName");
  assertSingleToken(input.loginName, "loginName");
  assertMaxLength(input.loginName, 64, "loginName");
  assertSingleToken(input.password, "password");
  assertMaxLength(input.password, 24, "password");

  return [
    frameSingleCommand(
      `ddns set -i ${String(input.accountIndex)} -S ${String(input.serviceProvider)} -T ${String(input.serviceType)} -D ${input.domainName} -L ${input.loginName} -P ${input.password}`,
    ),
  ];
}

export const ddnsSet: TypedOperation<DdnsSetInput, RawCommandOutput> = {
  manifestId: "cli.ddns.set",
  classification: "write",
  buildFrames: buildSetFrames,
  parse: (exchanges) => parseSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ddns.time -- `ddns time <update in minutes>` (rawLine 755) -- write.
// Bare status query without minutes is a deliberate YAGNI deferral.
// ---------------------------------------------------------------------------

export interface DdnsTimeInput {
  readonly minutes: number;
}

function buildTimeFrames(input: DdnsTimeInput): readonly CommandFrame[] {
  assertIntegerInRange(input.minutes, 1, 14_400, "minutes");

  return [frameSingleCommand(`ddns time ${String(input.minutes)}`)];
}

export const ddnsTime: TypedOperation<DdnsTimeInput, RawCommandOutput> = {
  manifestId: "cli.ddns.time",
  classification: "write",
  buildFrames: buildTimeFrames,
  parse: (exchanges) => parseTime(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ddns.setdefault -- `ddns setdefault` (rawLine 782) -- write.
// ---------------------------------------------------------------------------

function buildSetdefaultFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("ddns setdefault")];
}

export const ddnsSetdefault: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ddns.setdefault",
  classification: "write",
  buildFrames: buildSetdefaultFrames,
  parse: (exchanges) => parseSetdefault(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  ddnsEnable,
  ddnsLog,
  ddnsForceUpdate,
  ddnsShow,
  ddnsSet,
  ddnsTime,
  ddnsSetdefault,
];
