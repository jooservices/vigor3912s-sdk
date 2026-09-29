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

import { InvalidInputError } from "../errors.js";
import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseEnable } from "../internal/parsers/ddns/enable.js";
import { parseForceUpdate } from "../internal/parsers/ddns/forceupdate.js";
import { parseLog } from "../internal/parsers/ddns/log.js";
import { parseShow, type DdnsShowAccount } from "../internal/parsers/ddns/show.js";
import { parseSet } from "../internal/parsers/ddns/set.js";
import { parseTime } from "../internal/parsers/ddns/time.js";
import { parseSetdefault } from "../internal/parsers/ddns/setdefault.js";
import { parseRawText, type RawCommandOutput } from "../internal/parsers/ddns/shared.js";
import {
  assertCliValue,
  assertIntegerInRange,
  assertMaxLength,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

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

// ---------------------------------------------------------------------------
// cli.ddns.show.all -- bare `ddns show` (live-firmware-recon, not in the
// Part VIII PDF). A separate operation rather than an optional `-i` on
// `cli.ddns.show`: the bare form lists every account in an undocumented
// shape, so it returns raw text and never goes through the single-account
// `parseShow` (whose first-match regexes would silently drop accounts).
// ---------------------------------------------------------------------------

function buildShowAllFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("ddns show")];
}

export const ddnsShowAll: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ddns.show.all",
  classification: "read",
  buildFrames: buildShowAllFrames,
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

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
  assertCliValue(input.domainName, "domainName");
  assertMaxLength(input.domainName, 64, "domainName");
  assertCliValue(input.loginName, "loginName");
  assertMaxLength(input.loginName, 64, "loginName");
  assertCliValue(input.password, "password");
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

// ---------------------------------------------------------------------------
// cli.ddns.set.update -- `ddns set -i <index> [-<flag> <value> ...]`
// (rawLine 643): change any subset of one account's settings. `cli.ddns.set`
// keeps its 1.0.0 contract (the full core field set in one call).
// ---------------------------------------------------------------------------

export interface DdnsSetUpdateInput {
  /** Account 1..6. */
  readonly accountIndex: number;
  /** `-S` provider 1..19 (1 = User-Defined). */
  readonly serviceProvider?: number;
  /** `-T` 1 Dynamic, 2 Custom, 3 Static. */
  readonly serviceType?: number;
  /** `-D "<host> <sub domain>"`. */
  readonly domain?: { readonly hostName: string; readonly subDomain: string };
  /** `-L` login name (max 64). */
  readonly loginName?: string;
  /** `-P` password (max 24). */
  readonly password?: string;
  /** `-E` enable/disable the account. */
  readonly enabled?: boolean;
  /** `-W` 1..14: WAN1 First, WAN1 Only, WAN2 First, ... (odd First, even Only). */
  readonly wanInterface?: number;
  /** `-C` wildcards. */
  readonly wildcards?: boolean;
  /** `-B` backup MX. */
  readonly backupMx?: boolean;
  /** `-M` mail extender (max 60). */
  readonly mailExtender?: string;
  /** `-R` 0 WAN IP, 1 Internet IP. */
  readonly realWanIp?: number;
  /** `-H` user-defined provider host (max 64). */
  readonly providerHost?: string;
  /** `-A` user-defined service API (max 256). */
  readonly serviceApi?: string;
  /** `-a` user-defined auth type: 0 basic, 1 URL. */
  readonly authType?: number;
  /** `-N` user-defined connection type: 0 HTTP, 1 HTTPS. */
  readonly connectionType?: number;
  /** `-O` user-defined server response (max 32). */
  readonly serverResponse?: string;
}

function textFlag(flag: string, value: string | undefined, max: number, name: string): string[] {
  if (value === undefined) {
    return [];
  }

  assertCliValue(value, name);
  assertMaxLength(value, max, name);
  return [`-${flag} ${value}`];
}

function numberFlag(
  flag: string,
  value: number | undefined,
  min: number,
  max: number,
  name: string,
): string[] {
  if (value === undefined) {
    return [];
  }

  assertIntegerInRange(value, min, max, name);
  return [`-${flag} ${String(value)}`];
}

function bitFlag(flag: string, value: boolean | undefined): string[] {
  return value === undefined ? [] : [`-${flag} ${value ? "1" : "0"}`];
}

export const ddnsSetUpdate = defineRawOperation<DdnsSetUpdateInput>(
  "cli.ddns.set.update",
  "write",
  (input) => {
    assertIntegerInRange(input.accountIndex, 1, 6, "accountIndex");
    const domain: string[] = [];

    if (input.domain !== undefined) {
      assertCliValue(input.domain.hostName, "domain.hostName");
      assertCliValue(input.domain.subDomain, "domain.subDomain");
      domain.push(`-D "${input.domain.hostName} ${input.domain.subDomain}"`);
    }

    const parts = [
      ...numberFlag("S", input.serviceProvider, 1, 19, "serviceProvider"),
      ...numberFlag("T", input.serviceType, 1, 3, "serviceType"),
      ...domain,
      ...textFlag("L", input.loginName, 64, "loginName"),
      ...textFlag("P", input.password, 24, "password"),
      ...bitFlag("E", input.enabled),
      ...numberFlag("W", input.wanInterface, 1, 14, "wanInterface"),
      ...bitFlag("C", input.wildcards),
      ...bitFlag("B", input.backupMx),
      ...textFlag("M", input.mailExtender, 60, "mailExtender"),
      ...numberFlag("R", input.realWanIp, 0, 1, "realWanIp"),
      ...textFlag("H", input.providerHost, 64, "providerHost"),
      ...textFlag("A", input.serviceApi, 256, "serviceApi"),
      ...numberFlag("a", input.authType, 0, 1, "authType"),
      ...numberFlag("N", input.connectionType, 0, 1, "connectionType"),
      ...textFlag("O", input.serverResponse, 32, "serverResponse"),
    ];

    if (parts.length === 0) {
      throw new InvalidInputError("at least one setting besides accountIndex is required.");
    }

    return `ddns set -i ${String(input.accountIndex)} ${parts.join(" ")}`;
  },
);

export const operations: readonly TypedOperation<never, unknown>[] = [
  ddnsEnable,
  ddnsLog,
  ddnsForceUpdate,
  ddnsShow,
  ddnsShowAll,
  ddnsSet,
  ddnsSetUpdate,
  ddnsTime,
  ddnsSetdefault,
];
