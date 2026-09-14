/**
 * `apm` domain -- Wave 4 Item5-apm (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements every classified `cli.apm.*` manifest entry: the previously
 * shipped `cli.apm.stanum` plus the remaining documented siblings under
 * `apm enable|disable|show|clear|discover|query`, `apm profile *`,
 * `apm cache *`, `apm lbcfg *`, `apm apsyslog`, and `apm syslog`.
 *
 * Multi-variant headings (`apm profile`, `apm cache`, `apm lbcfg`) are
 * modelled as one `TypedOperation` per manifest entry (not one per
 * heading), matching the self-assembly contract. Flag-heavy forms such as
 * `apm lbcfg set` follow the documented example shape (11 numeric fields).
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/apm/*.ts`. Structured output is only modelled where the
 * vendor example itself documents a stable table (`apm stanum`); every other
 * command reduces to trimmed raw text.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseEnable } from "../internal/parsers/apm/enable.js";
import { parseDisable } from "../internal/parsers/apm/disable.js";
import { parseShow } from "../internal/parsers/apm/show.js";
import { parseClear } from "../internal/parsers/apm/clear.js";
import { parseDiscover } from "../internal/parsers/apm/discover.js";
import { parseQuery } from "../internal/parsers/apm/query.js";
import { parseProfileSummary } from "../internal/parsers/apm/profile-summary.js";
import { parseProfileShow } from "../internal/parsers/apm/profile-show.js";
import { parseProfileClone } from "../internal/parsers/apm/profile-clone.js";
import { parseProfileDel } from "../internal/parsers/apm/profile-del.js";
import { parseProfileReset } from "../internal/parsers/apm/profile-reset.js";
import { parseProfileApply } from "../internal/parsers/apm/profile-apply.js";
import { parseCacheShow } from "../internal/parsers/apm/cache-show.js";
import { parseCacheClear } from "../internal/parsers/apm/cache-clear.js";
import { parseLbcfgShow } from "../internal/parsers/apm/lbcfg-show.js";
import { parseLbcfgSet } from "../internal/parsers/apm/lbcfg-set.js";
import { parseApsyslog } from "../internal/parsers/apm/apsyslog.js";
import { parseSyslog } from "../internal/parsers/apm/syslog.js";
import { parseStanum, type ApmStationCountReport } from "../internal/parsers/apm/stanum.js";
import type { RawCommandOutput } from "../internal/parsers/apm/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer (got ${String(value)}).`);
  }
}

function assertPositiveInteger(value: number, name: string): void {
  assertInteger(value, name);

  if (value <= 0) {
    throw new Error(`${name} must be a positive integer (got ${String(value)}).`);
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

function assertNonEmptyString(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
}

function assertNumberOneOf<T extends number>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly number[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => String(entry)).join(", ")} (got ${String(value)}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.apm.enable / disable / show / clear / discover / query (rawLine 12017)
// ---------------------------------------------------------------------------

function buildEnableFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm enable")];
}

export const apmEnable: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.enable",
  classification: "write",
  buildFrames: buildEnableFrames,
  parse: (exchanges) => parseEnable(firstExchangeText(exchanges)),
};

function buildDisableFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm disable")];
}

export const apmDisable: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.disable",
  classification: "write",
  buildFrames: buildDisableFrames,
  parse: (exchanges) => parseDisable(firstExchangeText(exchanges)),
};

function buildShowFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm show")];
}

export const apmShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.show",
  classification: "read",
  buildFrames: buildShowFrames,
  parse: (exchanges) => parseShow(firstExchangeText(exchanges)),
};

function buildClearFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm clear")];
}

export const apmClear: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.clear",
  classification: "write",
  buildFrames: buildClearFrames,
  parse: (exchanges) => parseClear(firstExchangeText(exchanges)),
};

function buildDiscoverFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm discover")];
}

export const apmDiscover: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.discover",
  classification: "read",
  buildFrames: buildDiscoverFrames,
  parse: (exchanges) => parseDiscover(firstExchangeText(exchanges)),
};

function buildQueryFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm query")];
}

export const apmQuery: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.query",
  classification: "read",
  buildFrames: buildQueryFrames,
  parse: (exchanges) => parseQuery(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.apm.profile.* (rawLine 12044)
// ---------------------------------------------------------------------------

function buildProfileSummaryFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm profile summary")];
}

export const apmProfileSummary: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.profile.summary",
  classification: "read",
  buildFrames: buildProfileSummaryFrames,
  parse: (exchanges) => parseProfileSummary(firstExchangeText(exchanges)),
};

export interface ApmProfileShowInput {
  readonly index: number;
}

function buildProfileShowFrames(input: ApmProfileShowInput): readonly CommandFrame[] {
  assertPositiveInteger(input.index, "index");

  return [frameSingleCommand(`apm profile show ${String(input.index)}`)];
}

export const apmProfileShow: TypedOperation<ApmProfileShowInput, RawCommandOutput> = {
  manifestId: "cli.apm.profile.show",
  classification: "read",
  buildFrames: buildProfileShowFrames,
  parse: (exchanges) => parseProfileShow(firstExchangeText(exchanges)),
};

export interface ApmProfileCloneInput {
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly newName: string;
}

function buildProfileCloneFrames(input: ApmProfileCloneInput): readonly CommandFrame[] {
  assertPositiveInteger(input.fromIndex, "fromIndex");
  assertPositiveInteger(input.toIndex, "toIndex");
  assertNonEmptyString(input.newName, "newName");

  return [
    frameSingleCommand(
      `apm profile clone ${String(input.fromIndex)} ${String(input.toIndex)} ${input.newName}`,
    ),
  ];
}

export const apmProfileClone: TypedOperation<ApmProfileCloneInput, RawCommandOutput> = {
  manifestId: "cli.apm.profile.clone",
  classification: "write",
  buildFrames: buildProfileCloneFrames,
  parse: (exchanges) => parseProfileClone(firstExchangeText(exchanges)),
};

export interface ApmProfileDelInput {
  readonly index: number;
}

function buildProfileDelFrames(input: ApmProfileDelInput): readonly CommandFrame[] {
  assertPositiveInteger(input.index, "index");

  return [frameSingleCommand(`apm profile del ${String(input.index)}`)];
}

export const apmProfileDel: TypedOperation<ApmProfileDelInput, RawCommandOutput> = {
  manifestId: "cli.apm.profile.del",
  classification: "write",
  buildFrames: buildProfileDelFrames,
  parse: (exchanges) => parseProfileDel(firstExchangeText(exchanges)),
};

function buildProfileResetFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm profile reset")];
}

export const apmProfileReset: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.profile.reset",
  classification: "write",
  buildFrames: buildProfileResetFrames,
  parse: (exchanges) => parseProfileReset(firstExchangeText(exchanges)),
};

export interface ApmProfileApplyInput {
  readonly profileIndex: number;
  readonly clientIndexes: readonly [number, number, number, number, number];
}

function buildProfileApplyFrames(input: ApmProfileApplyInput): readonly CommandFrame[] {
  assertPositiveInteger(input.profileIndex, "profileIndex");

  for (const clientIndex of input.clientIndexes) {
    assertPositiveInteger(clientIndex, "each clientIndexes entry");
  }

  return [
    frameSingleCommand(
      `apm profile apply ${String(input.profileIndex)} ${input.clientIndexes.map(String).join(" ")}`,
    ),
  ];
}

export const apmProfileApply: TypedOperation<ApmProfileApplyInput, RawCommandOutput> = {
  manifestId: "cli.apm.profile.apply",
  classification: "write",
  buildFrames: buildProfileApplyFrames,
  parse: (exchanges) => parseProfileApply(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.apm.cache.* (rawLine 12100)
// ---------------------------------------------------------------------------

function buildCacheShowFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm cache show")];
}

export const apmCacheShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.cache.show",
  classification: "read",
  buildFrames: buildCacheShowFrames,
  parse: (exchanges) => parseCacheShow(firstExchangeText(exchanges)),
};

function buildCacheClearFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm cache clear")];
}

export const apmCacheClear: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.cache.clear",
  classification: "write",
  buildFrames: buildCacheClearFrames,
  parse: (exchanges) => parseCacheClear(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.apm.lbcfg.* (rawLine 12121)
// ---------------------------------------------------------------------------

function buildLbcfgShowFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm lbcfg show")];
}

export const apmLbcfgShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.lbcfg.show",
  classification: "read",
  buildFrames: buildLbcfgShowFrames,
  parse: (exchanges) => parseLbcfgShow(firstExchangeText(exchanges)),
};

export interface ApmLbcfgSetInput {
  readonly enableLoadBalance: 0 | 1;
  readonly enableStationLimit: 0 | 1;
  readonly enableTrafficLimit: 0 | 1;
  /** Documented station-limit count range: 3..64. */
  readonly stationLimit: number;
  readonly enableUploadLimit: 0 | 1;
  readonly enableDownloadLimit: 0 | 1;
  readonly enableIdleDisassociation: 0 | 1;
  readonly enableSignalDisassociation: 0 | 1;
  /** 0 = kbps, 1 = Mbps. */
  readonly uploadUnit: 0 | 1;
  /** 0 = kbps, 1 = Mbps. */
  readonly downloadUnit: 0 | 1;
  /** Documented RSSI threshold range: -200..-50. */
  readonly rssiThreshold: number;
}

function buildLbcfgSetFrames(input: ApmLbcfgSetInput): readonly CommandFrame[] {
  assertNumberOneOf<0 | 1>(input.enableLoadBalance, [0, 1], "enableLoadBalance");
  assertNumberOneOf<0 | 1>(input.enableStationLimit, [0, 1], "enableStationLimit");
  assertNumberOneOf<0 | 1>(input.enableTrafficLimit, [0, 1], "enableTrafficLimit");
  assertIntegerInRange(input.stationLimit, 3, 64, "stationLimit");
  assertNumberOneOf<0 | 1>(input.enableUploadLimit, [0, 1], "enableUploadLimit");
  assertNumberOneOf<0 | 1>(input.enableDownloadLimit, [0, 1], "enableDownloadLimit");
  assertNumberOneOf<0 | 1>(input.enableIdleDisassociation, [0, 1], "enableIdleDisassociation");
  assertNumberOneOf<0 | 1>(input.enableSignalDisassociation, [0, 1], "enableSignalDisassociation");
  assertNumberOneOf<0 | 1>(input.uploadUnit, [0, 1], "uploadUnit");
  assertNumberOneOf<0 | 1>(input.downloadUnit, [0, 1], "downloadUnit");
  assertIntegerInRange(input.rssiThreshold, -200, -50, "rssiThreshold");

  return [
    frameSingleCommand(
      [
        "apm lbcfg set",
        String(input.enableLoadBalance),
        String(input.enableStationLimit),
        String(input.enableTrafficLimit),
        String(input.stationLimit),
        String(input.enableUploadLimit),
        String(input.enableDownloadLimit),
        String(input.enableIdleDisassociation),
        String(input.enableSignalDisassociation),
        String(input.uploadUnit),
        String(input.downloadUnit),
        String(input.rssiThreshold),
      ].join(" "),
    ),
  ];
}

export const apmLbcfgSet: TypedOperation<ApmLbcfgSetInput, RawCommandOutput> = {
  manifestId: "cli.apm.lbcfg.set",
  classification: "write",
  buildFrames: buildLbcfgSetFrames,
  parse: (exchanges) => parseLbcfgSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.apm.apsyslog / cli.apm.syslog / cli.apm.stanum
// ---------------------------------------------------------------------------

export interface ApmApsyslogInput {
  readonly apIndex: number;
}

function buildApsyslogFrames(input: ApmApsyslogInput): readonly CommandFrame[] {
  assertPositiveInteger(input.apIndex, "apIndex");

  return [frameSingleCommand(`apm apsyslog ${String(input.apIndex)}`)];
}

export const apmApsyslog: TypedOperation<ApmApsyslogInput, RawCommandOutput> = {
  manifestId: "cli.apm.apsyslog",
  classification: "read",
  buildFrames: buildApsyslogFrames,
  parse: (exchanges) => parseApsyslog(firstExchangeText(exchanges)),
};

function buildSyslogFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("apm syslog")];
}

export const apmSyslog: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.apm.syslog",
  classification: "read",
  buildFrames: buildSyslogFrames,
  parse: (exchanges) => parseSyslog(firstExchangeText(exchanges)),
};

export interface ApmStanumInput {
  readonly apIndex: number;
}

function buildStanumFrames(input: ApmStanumInput): readonly CommandFrame[] {
  assertPositiveInteger(input.apIndex, "apIndex");

  return [frameSingleCommand(`apm stanum ${String(input.apIndex)}`)];
}

export const apmStanum: TypedOperation<ApmStanumInput, ApmStationCountReport> = {
  manifestId: "cli.apm.stanum",
  classification: "read",
  buildFrames: buildStanumFrames,
  parse: (exchanges) => parseStanum(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  apmEnable,
  apmDisable,
  apmShow,
  apmClear,
  apmDiscover,
  apmQuery,
  apmProfileSummary,
  apmProfileShow,
  apmProfileClone,
  apmProfileDel,
  apmProfileReset,
  apmProfileApply,
  apmCacheShow,
  apmCacheClear,
  apmLbcfgShow,
  apmLbcfgSet,
  apmApsyslog,
  apmSyslog,
  apmStanum,
];
