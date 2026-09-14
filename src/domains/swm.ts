/**
 * `swm` domain -- Wave 4 Item5-swm (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements all 13 `cli.swm.*` manifest entries assigned to this task, all
 * classified via `sibling-live-verified` evidence (`vigor3912s-mcp`'s
 * live-verified registry, `projects/vigor3912s-mcp/src/commands/registry/
 * families/swm.ts`, consulted read-only as evidence/precedent, never
 * imported or depended on at runtime -- that sibling module models every
 * write sub-command as one generic `param: safeText()` string, which is not
 * a usable argument shape here; this module's `buildFrames` input shapes
 * instead come from the documented syntax at each command's `rawLine` in
 * `.ai/skills/vigor3912s/references/cli-reference-raw.txt`).
 *
 * `cli.swm.show` / `cli.swm.get` are `classification: "read"`; the
 * remaining 11 are `classification: "write"`. `cli.swm.enable.disable` is
 * one manifest entry covering the same heading's `swm enable` / `swm
 * disable` pair -- modelled here as a two-variant discriminated union
 * input, one canonical frame per variant, per `ARCHITECTURE.md` Item 5's
 * "Multi-variant documented syntaxes under one heading ... modelled as a
 * discriminated `action`/`kind` union input" convention (already used by
 * `wan.ts`'s `WanVlanInput`/`WanBudgetInput`/`WanFailoverInput`).
 *
 * Several headings here (`swm group`, `swm profile`, `swm detail`, `swm
 * maintain`, `swm search`, `swm db`, `swm alert`, `swm log`, `swm snmp`)
 * document multiple sub-forms under one syntax block; each is modelled as
 * its own discriminated union covering every sub-form the heading's own
 * `SSyynnttaaxx` block enumerates, except `swm alert`'s nested per-switch/
 * per-port incident forms (`en/dis <sw/port> <mac>`, `sw show <mac>`, `set
 * sw <mac> <incident idx> <level idx>`, `port show <mac>`, `set port <mac>
 * <port num> <incident idx> <level idx>`), which are a deliberate YAGNI
 * deferral noted at that operation -- the same class of partial-heading
 * coverage already established by `wan.ts` (e.g. `wanLb`, `wanMvlan`,
 * `wanVlan`, `wanBudget`, `wanFailover` each defer some documented
 * sub-forms while still fully implementing their manifest entry).
 *
 * Every `buildFrames` validates its input before calling
 * `frameSingleCommand` -- `frameSingleCommand` itself only rejects framing
 * hazards (control chars, shell metacharacters, empty input), it has no
 * notion of a command's own documented argument shape. Validation failures
 * throw a plain `Error` (this family's write scope excludes `src/errors.ts`,
 * so no new `SdkErrorCode` is introduced here, same as `wan.ts`).
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => RawCommandOutput` parser in
 * `internal/parsers/swm/*.ts` -- see `internal/parsers/swm/shared.ts` for
 * why every operation in this family reduces to trimmed raw text rather
 * than a richer DTO (none of these 13 commands document a structured
 * response schema; several document ragged, PDF-extraction-mangled fixed
 * width tables with no stable schema to parse against honestly).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseSwmAlert } from "../internal/parsers/swm/alert.js";
import { parseSwmDb } from "../internal/parsers/swm/db.js";
import { parseSwmDetail } from "../internal/parsers/swm/detail.js";
import { parseSwmEnableDisable } from "../internal/parsers/swm/enabledisable.js";
import { parseSwmGet } from "../internal/parsers/swm/get.js";
import { parseSwmGroup } from "../internal/parsers/swm/group.js";
import { parseSwmLog } from "../internal/parsers/swm/log.js";
import { parseSwmMaintain } from "../internal/parsers/swm/maintain.js";
import { parseSwmPost } from "../internal/parsers/swm/post.js";
import { parseSwmProfile } from "../internal/parsers/swm/profile.js";
import { parseSwmSearch } from "../internal/parsers/swm/search.js";
import { parseSwmShow } from "../internal/parsers/swm/show.js";
import { parseSwmSnmp } from "../internal/parsers/swm/snmp.js";
import type { RawCommandOutput } from "../internal/parsers/swm/shared.js";

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

function assertPositiveInteger(value: number, name: string): void {
  assertInteger(value, name);

  if (value <= 0) {
    throw new Error(`${name} must be a positive integer (got ${String(value)}).`);
  }
}

/**
 * Generic runtime membership check for narrow string-literal-union inputs
 * (mirrors `wan.ts`'s `assertOneOf`, kept local to this family per the
 * self-assembled-domains model's deliberate small-local-helper duplication
 * -- no shared cross-domain validator module exists yet, YAGNI).
 */
function assertOneOf<T extends string>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => `"${entry}"`).join(", ")} (got "${value}").`,
    );
  }
}

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function assertIpv4(value: string, name: string): void {
  if (!IPV4_PATTERN.test(value)) {
    throw new Error(`${name} must be a valid IPv4 address (got "${value}").`);
  }
}

/**
 * Every documented `swm *` MAC-address parameter is printed unadorned hex,
 * e.g. `001DAA0CCD08` (rawLine 12494 `swm get`'s own parameter
 * description), not colon-separated -- distinct from `ip.ts`'s
 * colon-separated `MAC_PATTERN`, which documents a different family's
 * syntax.
 */
const MAC_PATTERN = /^[0-9A-Fa-f]{12}$/;

function assertMac(value: string, name: string): void {
  if (!MAC_PATTERN.test(value)) {
    throw new Error(`${name} must be a 12 hex-digit MAC address (got "${value}").`);
  }
}

/**
 * Every documented free-text `swm *` parameter (`<NAME>`, `<PASSWD>`,
 * `<COMMENT>`, etc.) appears only as a single unquoted word in every
 * worked example in the corpus (e.g. rawLine 12554 `pease`, rawLine 12675
 * `availablefor2floor`, rawLine 12554 `jpsword`) -- this DrayOS CLI is
 * documented as space-delimited positional syntax with no quoting
 * mechanism, so a value containing whitespace could not round-trip through
 * the real router's parser regardless of its position in the frame.
 * Rejecting whitespace here (in addition to `frameSingleCommand`'s own
 * framing-level rejections) keeps every generated frame faithful to the
 * documented single-token shape.
 */
function assertToken(value: string, name: string): void {
  if (value.length === 0 || /\s/.test(value)) {
    throw new Error(
      `${name} must be a single non-empty token with no whitespace (got "${value}").`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.swm.show -- `swm show <LAN_port>` (rawLine 12428) -- read
// ---------------------------------------------------------------------------

export interface SwmShowInput {
  readonly lanPort: number;
}

function buildSwmShowFrames(input: SwmShowInput): readonly CommandFrame[] {
  assertIntegerInRange(input.lanPort, 1, 12, "lanPort");

  return [frameSingleCommand(`swm show ${String(input.lanPort)}`)];
}

export const swmShow: TypedOperation<SwmShowInput, RawCommandOutput> = {
  manifestId: "cli.swm.show",
  classification: "read",
  buildFrames: buildSwmShowFrames,
  parse: (exchanges) => parseSwmShow(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.get -- `swm get <MAC>` (rawLine 12482) -- read
// ---------------------------------------------------------------------------

export interface SwmGetInput {
  readonly mac: string;
}

function buildSwmGetFrames(input: SwmGetInput): readonly CommandFrame[] {
  assertMac(input.mac, "mac");

  return [frameSingleCommand(`swm get ${input.mac}`)];
}

export const swmGet: TypedOperation<SwmGetInput, RawCommandOutput> = {
  manifestId: "cli.swm.get",
  classification: "read",
  buildFrames: buildSwmGetFrames,
  parse: (exchanges) => parseSwmGet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.post -- `swm post <MAC>` (rawLine 12503) -- write
// ---------------------------------------------------------------------------

export interface SwmPostInput {
  readonly mac: string;
}

function buildSwmPostFrames(input: SwmPostInput): readonly CommandFrame[] {
  assertMac(input.mac, "mac");

  return [frameSingleCommand(`swm post ${input.mac}`)];
}

export const swmPost: TypedOperation<SwmPostInput, RawCommandOutput> = {
  manifestId: "cli.swm.post",
  classification: "write",
  buildFrames: buildSwmPostFrames,
  parse: (exchanges) => parseSwmPost(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.enable.disable -- `swm enable` / `swm disable` (rawLine 12517) --
// write
// ---------------------------------------------------------------------------

export type SwmEnableDisableInput = { readonly action: "enable" } | { readonly action: "disable" };

function buildSwmEnableDisableFrames(input: SwmEnableDisableInput): readonly CommandFrame[] {
  assertOneOf(input.action, ["enable", "disable"], "action");

  return [frameSingleCommand(`swm ${input.action}`)];
}

export const swmEnableDisable: TypedOperation<SwmEnableDisableInput, RawCommandOutput> = {
  manifestId: "cli.swm.enable.disable",
  classification: "write",
  buildFrames: buildSwmEnableDisableFrames,
  parse: (exchanges) => parseSwmEnableDisable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.group -- `swm group set <IDX> <NAME> <1> <PASSWD>` / `swm group
// set <IDX> <NAME> <0>` / `swm group show` / `swm group add <IDX> <MAC>` /
// `swm group delete <IDX> <MAC>` (rawLine 12529) -- write
// ---------------------------------------------------------------------------

export type SwmGroupInput =
  | {
      readonly action: "setWithPassword";
      readonly idx: number;
      readonly name: string;
      readonly password: string;
    }
  | { readonly action: "setNoPassword"; readonly idx: number; readonly name: string }
  | { readonly action: "show" }
  | { readonly action: "add"; readonly idx: number; readonly mac: string }
  | { readonly action: "delete"; readonly idx: number; readonly mac: string };

function buildSwmGroupFrames(input: SwmGroupInput): readonly CommandFrame[] {
  switch (input.action) {
    case "setWithPassword": {
      assertIntegerInRange(input.idx, 1, 10, "idx");
      assertToken(input.name, "name");
      assertToken(input.password, "password");

      return [
        frameSingleCommand(`swm group set ${String(input.idx)} ${input.name} 1 ${input.password}`),
      ];
    }
    case "setNoPassword": {
      assertIntegerInRange(input.idx, 1, 10, "idx");
      assertToken(input.name, "name");

      return [frameSingleCommand(`swm group set ${String(input.idx)} ${input.name} 0`)];
    }
    case "show": {
      return [frameSingleCommand("swm group show")];
    }
    case "add": {
      assertIntegerInRange(input.idx, 1, 10, "idx");
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm group add ${String(input.idx)} ${input.mac}`)];
    }
    case "delete": {
      assertIntegerInRange(input.idx, 1, 10, "idx");
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm group delete ${String(input.idx)} ${input.mac}`)];
    }
  }
}

export const swmGroup: TypedOperation<SwmGroupInput, RawCommandOutput> = {
  manifestId: "cli.swm.group",
  classification: "write",
  buildFrames: buildSwmGroupFrames,
  parse: (exchanges) => parseSwmGroup(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.profile -- `swm profile add/delete <MAC>` / `swm profile show` /
// `swm profile enable_all/disable_all <MAC>` (rawLine 12574) -- write
// ---------------------------------------------------------------------------

export type SwmProfileInput =
  | { readonly action: "add"; readonly mac: string }
  | { readonly action: "delete"; readonly mac: string }
  | { readonly action: "show" }
  | { readonly action: "enableAll"; readonly mac: string }
  | { readonly action: "disableAll"; readonly mac: string };

function buildSwmProfileFrames(input: SwmProfileInput): readonly CommandFrame[] {
  switch (input.action) {
    case "add": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm profile add ${input.mac}`)];
    }
    case "delete": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm profile delete ${input.mac}`)];
    }
    case "show": {
      return [frameSingleCommand("swm profile show")];
    }
    case "enableAll": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm profile enable_all ${input.mac}`)];
    }
    case "disableAll": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm profile disable_all ${input.mac}`)];
    }
  }
}

export const swmProfile: TypedOperation<SwmProfileInput, RawCommandOutput> = {
  manifestId: "cli.swm.profile",
  classification: "write",
  buildFrames: buildSwmProfileFrames,
  parse: (exchanges) => parseSwmProfile(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.detail -- `swm detail comment/name/passwd/config <MAC> <...>` /
// `swm detail show` / `swm detail port show <MAC>` / `swm detail port <MAC>
// <PORT> <FLAG> <SCHED1> <SCHED2> <DESCRIPTION>` / `swm detail rate <MAC>
// <PORT> <i/e> <e/d>` / `swm detail rate <MAC> <PORT> <i/e> <ratelimit>`
// (rawLine 12604) -- write
// ---------------------------------------------------------------------------

export type SwmDetailInput =
  | { readonly action: "comment"; readonly mac: string; readonly comment: string }
  | { readonly action: "name"; readonly mac: string; readonly name: string }
  | { readonly action: "passwd"; readonly mac: string; readonly password: string }
  | { readonly action: "config"; readonly mac: string; readonly configIndex: number }
  | { readonly action: "show" }
  | { readonly action: "portShow"; readonly mac: string }
  | {
      readonly action: "port";
      readonly mac: string;
      readonly port: number;
      readonly flag: string;
      readonly schedule1: number;
      readonly schedule2: number;
      readonly description: string;
    }
  | {
      readonly action: "rateToggle";
      readonly mac: string;
      readonly port: number;
      readonly direction: "i" | "e";
      readonly enabled: boolean;
    }
  | {
      readonly action: "rateLimit";
      readonly mac: string;
      readonly port: number;
      readonly direction: "i" | "e";
      readonly limit: number;
    };

function assertNonNegativeInteger(value: number, name: string): void {
  assertInteger(value, name);

  if (value < 0) {
    throw new Error(`${name} must not be negative (got ${String(value)}).`);
  }
}

function buildSwmDetailFrames(input: SwmDetailInput): readonly CommandFrame[] {
  switch (input.action) {
    case "comment": {
      assertMac(input.mac, "mac");
      assertToken(input.comment, "comment");

      return [frameSingleCommand(`swm detail comment ${input.mac} ${input.comment}`)];
    }
    case "name": {
      assertMac(input.mac, "mac");
      assertToken(input.name, "name");

      return [frameSingleCommand(`swm detail name ${input.mac} ${input.name}`)];
    }
    case "passwd": {
      assertMac(input.mac, "mac");
      assertToken(input.password, "password");

      return [frameSingleCommand(`swm detail passwd ${input.mac} ${input.password}`)];
    }
    case "config": {
      assertMac(input.mac, "mac");
      assertNonNegativeInteger(input.configIndex, "configIndex");

      return [frameSingleCommand(`swm detail config ${input.mac} ${String(input.configIndex)}`)];
    }
    case "show": {
      return [frameSingleCommand("swm detail show")];
    }
    case "portShow": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm detail port show ${input.mac}`)];
    }
    case "port": {
      assertMac(input.mac, "mac");
      assertIntegerInRange(input.port, 1, 28, "port");
      assertToken(input.flag, "flag");
      assertNonNegativeInteger(input.schedule1, "schedule1");
      assertNonNegativeInteger(input.schedule2, "schedule2");
      assertToken(input.description, "description");

      return [
        frameSingleCommand(
          `swm detail port ${input.mac} ${String(input.port)} ${input.flag} ${String(input.schedule1)} ${String(input.schedule2)} ${input.description}`,
        ),
      ];
    }
    case "rateToggle": {
      assertMac(input.mac, "mac");
      assertIntegerInRange(input.port, 1, 28, "port");
      assertOneOf(input.direction, ["i", "e"], "direction");

      return [
        frameSingleCommand(
          `swm detail rate ${input.mac} ${String(input.port)} ${input.direction} ${input.enabled ? "e" : "d"}`,
        ),
      ];
    }
    case "rateLimit": {
      assertMac(input.mac, "mac");
      assertIntegerInRange(input.port, 1, 28, "port");
      assertOneOf(input.direction, ["i", "e"], "direction");
      assertPositiveInteger(input.limit, "limit");

      return [
        frameSingleCommand(
          `swm detail rate ${input.mac} ${String(input.port)} ${input.direction} ${String(input.limit)}`,
        ),
      ];
    }
  }
}

export const swmDetail: TypedOperation<SwmDetailInput, RawCommandOutput> = {
  manifestId: "cli.swm.detail",
  classification: "write",
  buildFrames: buildSwmDetailFrames,
  parse: (exchanges) => parseSwmDetail(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.maintain -- `swm maintain reboot <MAC>` / `swm maintain reset
// <MAC>` / `swm maintain show` (rawLine 12698) -- write
// ---------------------------------------------------------------------------

export type SwmMaintainInput =
  | { readonly action: "reboot"; readonly mac: string }
  | { readonly action: "reset"; readonly mac: string }
  | { readonly action: "show" };

function buildSwmMaintainFrames(input: SwmMaintainInput): readonly CommandFrame[] {
  switch (input.action) {
    case "reboot": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm maintain reboot ${input.mac}`)];
    }
    case "reset": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm maintain reset ${input.mac}`)];
    }
    case "show": {
      return [frameSingleCommand("swm maintain show")];
    }
  }
}

export const swmMaintain: TypedOperation<SwmMaintainInput, RawCommandOutput> = {
  manifestId: "cli.swm.maintain",
  classification: "write",
  buildFrames: buildSwmMaintainFrames,
  parse: (exchanges) => parseSwmMaintain(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.search -- `swm search mac <MAC>` / `swm search ip <IP>` / `swm
// search description <Input>` (rawLine 12720) -- write (per
// `vigor3912s-mcp`'s live-verified classification; the command mutates no
// device state but is not on the read allowlist either -- classification
// honestly reflects the sibling-live-verified evidence, not this domain's
// own re-derivation).
// ---------------------------------------------------------------------------

export type SwmSearchInput =
  | { readonly action: "mac"; readonly mac: string }
  | { readonly action: "ip"; readonly ip: string }
  | { readonly action: "description"; readonly query: string };

function assertNonEmpty(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
}

function buildSwmSearchFrames(input: SwmSearchInput): readonly CommandFrame[] {
  switch (input.action) {
    case "mac": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm search mac ${input.mac}`)];
    }
    case "ip": {
      assertIpv4(input.ip, "ip");

      return [frameSingleCommand(`swm search ip ${input.ip}`)];
    }
    case "description": {
      assertNonEmpty(input.query, "query");

      return [frameSingleCommand(`swm search description ${input.query}`)];
    }
  }
}

export const swmSearch: TypedOperation<SwmSearchInput, RawCommandOutput> = {
  manifestId: "cli.swm.search",
  classification: "write",
  buildFrames: buildSwmSearchFrames,
  parse: (exchanges) => parseSwmSearch(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.db -- `swm db ctl en/dis` / `swm db ctl show` / `swm db alert
// notify <N/S>` / `swm db alert action <S/B>` / `swm db alert sms <IDX>` /
// `swm db alert mail <IDX>` (rawLine 12744) -- write
// ---------------------------------------------------------------------------

export type SwmDbInput =
  | { readonly action: "ctlToggle"; readonly enabled: boolean }
  | { readonly action: "ctlShow" }
  | { readonly action: "alertNotify"; readonly mode: "N" | "S" }
  | { readonly action: "alertAction"; readonly mode: "S" | "B" }
  | { readonly action: "alertSms"; readonly idx: number }
  | { readonly action: "alertMail"; readonly idx: number };

function buildSwmDbFrames(input: SwmDbInput): readonly CommandFrame[] {
  switch (input.action) {
    case "ctlToggle": {
      return [frameSingleCommand(`swm db ctl ${input.enabled ? "en" : "dis"}`)];
    }
    case "ctlShow": {
      return [frameSingleCommand("swm db ctl show")];
    }
    case "alertNotify": {
      assertOneOf(input.mode, ["N", "S"], "mode");

      return [frameSingleCommand(`swm db alert notify ${input.mode}`)];
    }
    case "alertAction": {
      assertOneOf(input.mode, ["S", "B"], "mode");

      return [frameSingleCommand(`swm db alert action ${input.mode}`)];
    }
    case "alertSms": {
      assertPositiveInteger(input.idx, "idx");

      return [frameSingleCommand(`swm db alert sms ${String(input.idx)}`)];
    }
    case "alertMail": {
      assertPositiveInteger(input.idx, "idx");

      return [frameSingleCommand(`swm db alert mail ${String(input.idx)}`)];
    }
  }
}

export const swmDb: TypedOperation<SwmDbInput, RawCommandOutput> = {
  manifestId: "cli.swm.db",
  classification: "write",
  buildFrames: buildSwmDbFrames,
  parse: (exchanges) => parseSwmDb(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.alert -- `swm alert enable/disable` / `swm alert show` / `swm
// alert en/dis <Idx>` / `swm alert set <Idx> log <e/d>` / `swm alert set
// <Idx> name <name>` / `swm alert set <Idx> color <O/R/N>` / `swm alert set
// <Idx> notif <e/d>` / `swm alert set <Idx> obj <object idx> <object
// value>` / `swm alert display` (rawLine 12778) -- write.
//
// The heading's nested per-switch/per-port incident sub-forms (`swm alert
// en/dis <sw/port> <mac>`, `swm alert sw show <mac>`, `swm alert set sw
// <mac> <incident idx> <level idx>`, `swm alert port show <mac>`, `swm
// alert set port <mac> <port num> <incident idx> <level idx>`) are a
// deliberate YAGNI deferral for this task, the same class of partial-
// heading coverage already established by `wan.ts` (e.g. `wanFailover`
// defers its `newlb` sub-form) -- not an oversight.
// ---------------------------------------------------------------------------

export type SwmAlertInput =
  | { readonly action: "toggle"; readonly enabled: boolean }
  | { readonly action: "show" }
  | { readonly action: "actionToggle"; readonly idx: number; readonly enabled: boolean }
  | { readonly action: "setLog"; readonly idx: number; readonly enabled: boolean }
  | { readonly action: "setName"; readonly idx: number; readonly name: string }
  | { readonly action: "setColor"; readonly idx: number; readonly color: "O" | "R" | "N" }
  | { readonly action: "setNotif"; readonly idx: number; readonly enabled: boolean }
  | {
      readonly action: "setObject";
      readonly idx: number;
      readonly objectIndex: number;
      readonly objectValue: number;
    }
  | { readonly action: "display" };

function buildSwmAlertFrames(input: SwmAlertInput): readonly CommandFrame[] {
  switch (input.action) {
    case "toggle": {
      return [frameSingleCommand(`swm alert ${input.enabled ? "enable" : "disable"}`)];
    }
    case "show": {
      return [frameSingleCommand("swm alert show")];
    }
    case "actionToggle": {
      assertIntegerInRange(input.idx, 1, 8, "idx");

      return [frameSingleCommand(`swm alert ${input.enabled ? "en" : "dis"} ${String(input.idx)}`)];
    }
    case "setLog": {
      assertIntegerInRange(input.idx, 1, 8, "idx");

      return [
        frameSingleCommand(`swm alert set ${String(input.idx)} log ${input.enabled ? "e" : "d"}`),
      ];
    }
    case "setName": {
      assertIntegerInRange(input.idx, 1, 8, "idx");
      assertToken(input.name, "name");

      return [frameSingleCommand(`swm alert set ${String(input.idx)} name ${input.name}`)];
    }
    case "setColor": {
      assertIntegerInRange(input.idx, 2, 8, "idx");
      assertOneOf(input.color, ["O", "R", "N"], "color");

      return [frameSingleCommand(`swm alert set ${String(input.idx)} color ${input.color}`)];
    }
    case "setNotif": {
      assertIntegerInRange(input.idx, 3, 8, "idx");

      return [
        frameSingleCommand(`swm alert set ${String(input.idx)} notif ${input.enabled ? "e" : "d"}`),
      ];
    }
    case "setObject": {
      assertIntegerInRange(input.idx, 3, 8, "idx");
      assertIntegerInRange(input.objectIndex, 1, 4, "objectIndex");
      assertIntegerInRange(input.objectValue, 1, 10, "objectValue");

      return [
        frameSingleCommand(
          `swm alert set ${String(input.idx)} obj ${String(input.objectIndex)} ${String(input.objectValue)}`,
        ),
      ];
    }
    case "display": {
      return [frameSingleCommand("swm alert display")];
    }
  }
}

export const swmAlert: TypedOperation<SwmAlertInput, RawCommandOutput> = {
  manifestId: "cli.swm.alert",
  classification: "write",
  buildFrames: buildSwmAlertFrames,
  parse: (exchanges) => parseSwmAlert(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.log -- `swm log show filter/day/week` / `swm log set level <idx>
// on/off` / `swm log set type <idx> on/off` / `swm log set switch <mac>
// on/off` (rawLine 12880) -- write
// ---------------------------------------------------------------------------

export type SwmLogInput =
  | { readonly action: "showFilter" }
  | { readonly action: "showDay" }
  | { readonly action: "showWeek" }
  | { readonly action: "setLevel"; readonly idx: number; readonly enabled: boolean }
  | { readonly action: "setType"; readonly idx: number; readonly enabled: boolean }
  | { readonly action: "setSwitch"; readonly mac: string; readonly enabled: boolean };

function buildSwmLogFrames(input: SwmLogInput): readonly CommandFrame[] {
  switch (input.action) {
    case "showFilter": {
      return [frameSingleCommand("swm log show filter")];
    }
    case "showDay": {
      return [frameSingleCommand("swm log show day")];
    }
    case "showWeek": {
      return [frameSingleCommand("swm log show week")];
    }
    case "setLevel": {
      assertIntegerInRange(input.idx, 1, 8, "idx");

      return [
        frameSingleCommand(
          `swm log set level ${String(input.idx)} ${input.enabled ? "on" : "off"}`,
        ),
      ];
    }
    case "setType": {
      assertIntegerInRange(input.idx, 1, 2, "idx");

      return [
        frameSingleCommand(`swm log set type ${String(input.idx)} ${input.enabled ? "on" : "off"}`),
      ];
    }
    case "setSwitch": {
      assertMac(input.mac, "mac");

      return [
        frameSingleCommand(`swm log set switch ${input.mac} ${input.enabled ? "on" : "off"}`),
      ];
    }
  }
}

export const swmLog: TypedOperation<SwmLogInput, RawCommandOutput> = {
  manifestId: "cli.swm.log",
  classification: "write",
  buildFrames: buildSwmLogFrames,
  parse: (exchanges) => parseSwmLog(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.swm.snmp -- `swm snmp sys <MAC>` / `swm snmp iftbl <MAC> <port_num>` /
// `swm snmp poe <MAC>` / `swm snmp trpcom show <MAC>` / `swm snmp trpcom
// set <MAC> <name>` (rawLine 12929) -- write (per `vigor3912s-mcp`'s
// live-verified classification, honestly reflected here as with
// `cli.swm.search` above -- these SNMP queries are gated by the router's
// own SWM proxy, not treated as plain reads by the live-verified evidence).
// ---------------------------------------------------------------------------

export type SwmSnmpInput =
  | { readonly action: "sys"; readonly mac: string }
  | { readonly action: "iftbl"; readonly mac: string; readonly portNum: number }
  | { readonly action: "poe"; readonly mac: string }
  | { readonly action: "trpcomShow"; readonly mac: string }
  | { readonly action: "trpcomSet"; readonly mac: string; readonly name: string };

function buildSwmSnmpFrames(input: SwmSnmpInput): readonly CommandFrame[] {
  switch (input.action) {
    case "sys": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm snmp sys ${input.mac}`)];
    }
    case "iftbl": {
      assertMac(input.mac, "mac");
      assertIntegerInRange(input.portNum, 1, 28, "portNum");

      return [frameSingleCommand(`swm snmp iftbl ${input.mac} ${String(input.portNum)}`)];
    }
    case "poe": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm snmp poe ${input.mac}`)];
    }
    case "trpcomShow": {
      assertMac(input.mac, "mac");

      return [frameSingleCommand(`swm snmp trpcom show ${input.mac}`)];
    }
    case "trpcomSet": {
      assertMac(input.mac, "mac");
      assertToken(input.name, "name");

      return [frameSingleCommand(`swm snmp trpcom set ${input.mac} ${input.name}`)];
    }
  }
}

export const swmSnmp: TypedOperation<SwmSnmpInput, RawCommandOutput> = {
  manifestId: "cli.swm.snmp",
  classification: "write",
  buildFrames: buildSwmSnmpFrames,
  parse: (exchanges) => parseSwmSnmp(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  swmShow,
  swmGet,
  swmPost,
  swmEnableDisable,
  swmGroup,
  swmProfile,
  swmDetail,
  swmMaintain,
  swmSearch,
  swmDb,
  swmAlert,
  swmLog,
  swmSnmp,
];
