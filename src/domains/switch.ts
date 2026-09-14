/**
 * `switch` domain -- Wave 4 Item5-switch (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements classified `cli.switch.*` entries including previously deferred
 * `-i` traffic query, `not_respond`, `clear`, and `syslog`.
 *
 * ## `switch on` / `switch off` / `switch query`'s argument shape
 *
 * `cli-reference-raw.txt`'s own `switch on` / `switch off` headings (rawLine
 * 7735 / 7740) document these as bare, no-argument commands ("This command
 * is used to turn on/off the auto discovery for external devices", example
 * `> switch on` / `> switch off`, no `Syntax` section) -- matching the
 * manifest's own `command` field (`"switch on"` / `"switch off"`, no
 * placeholder). `vigor3912s-mcp`'s `switch.ts` family file renders these as
 * `switch on ${param}` / `switch off ${param}` with a generic `safeText()`
 * parameter, but that shape is a repeated boilerplate template used
 * verbatim across dozens of unrelated `W(...)` entries in that project
 * (`csm`, `ha`, `hsportal`, `ip6`, `ipf`, `ldap`, ...) wherever a family
 * needs at least one write with a free-text argument -- not evidence that
 * *this* command takes one. The vendor documentation and the manifest's own
 * `command` field are the more specific, command-particular sources of
 * truth here, so both operations below build the bare command with no
 * input.
 *
 * `cli.switch.query`'s heading (rawLine 7770) documents only the
 * `switch query on` / `switch query off` toggle sub-forms in its example
 * text ("This command is used to enable or disable the switch query.") --
 * which reads as a mutation, yet the manifest's `sibling-live-verified`
 * classification is `"read"` and its `command` field is the bare `"switch
 * query"` (no toggle argument), matching `vigor3912s-mcp`'s own
 * `R('switch_query', 'switch', 'switch query', ...)` (a plain, argument-less
 * read builder, not `W(...)`). Following the same "one entry, one honest
 * classification" reasoning as `cli.wan.detect` in `src/domains/wan.ts`, this
 * operation models only the bare read-query form; the `on`/`off` toggle
 * sub-forms are a deliberate YAGNI deferral (no manifest entry classifies
 * them, and inventing one is out of scope for this task).
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/switch/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseSwitchStatus, type SwitchStatusReport } from "../internal/parsers/switch/status.js";
import { parseSwitchList, type SwitchListReport } from "../internal/parsers/switch/list.js";
import { parseQuery } from "../internal/parsers/switch/query.js";
import { parseOn } from "../internal/parsers/switch/on.js";
import { parseOff } from "../internal/parsers/switch/off.js";
import { parseSwitchI } from "../internal/parsers/switch/i.js";
import { parseNotRespond } from "../internal/parsers/switch/notrespond.js";
import { parseClear } from "../internal/parsers/switch/clear.js";
import { parseSyslog } from "../internal/parsers/switch/syslog.js";
import type { RawCommandOutput } from "../internal/parsers/switch/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

// ---------------------------------------------------------------------------
// cli.switch.status -- `switch status` (rawLine 7709) -- read
// ---------------------------------------------------------------------------

function buildStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("switch status")];
}

export const switchStatus: TypedOperation<void, SwitchStatusReport> = {
  manifestId: "cli.switch.status",
  classification: "read",
  buildFrames: buildStatusFrames,
  parse: (exchanges) => parseSwitchStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.switch.on -- `switch on` (rawLine 7735) -- write, bare command (see
// this file's header comment for why no input is modelled).
// ---------------------------------------------------------------------------

function buildOnFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("switch on")];
}

export const switchOn: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.switch.on",
  classification: "write",
  buildFrames: buildOnFrames,
  parse: (exchanges) => parseOn(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.switch.off -- `switch off` (rawLine 7740) -- write, bare command (see
// this file's header comment for why no input is modelled).
// ---------------------------------------------------------------------------

function buildOffFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("switch off")];
}

export const switchOff: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.switch.off",
  classification: "write",
  buildFrames: buildOffFrames,
  parse: (exchanges) => parseOff(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.switch.list -- `switch list` (rawLine 7745) -- read
// ---------------------------------------------------------------------------

function buildListFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("switch list")];
}

export const switchList: TypedOperation<void, SwitchListReport> = {
  manifestId: "cli.switch.list",
  classification: "read",
  buildFrames: buildListFrames,
  parse: (exchanges) => parseSwitchList(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.switch.query -- `switch query` (rawLine 7770) -- read, bare command
// (see this file's header comment for why the on/off toggle sub-forms are
// not modelled here).
// ---------------------------------------------------------------------------

function buildQueryFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("switch query")];
}

export const switchQuery: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.switch.query",
  classification: "read",
  buildFrames: buildQueryFrames,
  parse: (exchanges) => parseQuery(firstExchangeText(exchanges)),
};

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

function assertOneOf<T extends string>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => JSON.stringify(entry)).join(", ")} (got ${JSON.stringify(value)}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.switch.i -- `switch -i <idx> traffic <on/off/status/tx/rx>` (rawLine
// 7687) -- read. YAGNI: traffic sub-command only; cmd/acc deferred.
// ---------------------------------------------------------------------------

export interface SwitchIInput {
  readonly index: number;
  readonly traffic: "on" | "off" | "status" | "tx" | "rx";
}

function buildSwitchIFrames(input: SwitchIInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, 1, 8, "index");
  assertOneOf(input.traffic, ["on", "off", "status", "tx", "rx"], "traffic");

  return [frameSingleCommand(`switch -i ${String(input.index)} traffic ${input.traffic}`)];
}

export const switchI: TypedOperation<SwitchIInput, RawCommandOutput> = {
  manifestId: "cli.switch.i",
  classification: "read",
  buildFrames: buildSwitchIFrames,
  parse: (exchanges) => parseSwitchI(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.switch.notrespond -- `switch not_respond <0/1>` (rawLine 7717) -- write.
// ---------------------------------------------------------------------------

export interface SwitchNotRespondInput {
  readonly enabled: boolean;
}

function buildNotRespondFrames(input: SwitchNotRespondInput): readonly CommandFrame[] {
  return [frameSingleCommand(`switch not_respond ${input.enabled ? "1" : "0"}`)];
}

export const switchNotRespond: TypedOperation<SwitchNotRespondInput, RawCommandOutput> = {
  manifestId: "cli.switch.notrespond",
  classification: "write",
  buildFrames: buildNotRespondFrames,
  parse: (exchanges) => parseNotRespond(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.switch.clear -- `switch clear <idx|-f>` (rawLine 7752) -- write.
// ---------------------------------------------------------------------------

export type SwitchClearInput = { readonly index: number } | { readonly all: true };

function buildClearFrames(input: SwitchClearInput): readonly CommandFrame[] {
  if ("all" in input) {
    return [frameSingleCommand("switch clear -f")];
  }

  assertIntegerInRange(input.index, 1, 8, "index");

  return [frameSingleCommand(`switch clear ${String(input.index)}`)];
}

export const switchClear: TypedOperation<SwitchClearInput, RawCommandOutput> = {
  manifestId: "cli.switch.clear",
  classification: "write",
  buildFrames: buildClearFrames,
  parse: (exchanges) => parseClear(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.switch.syslog -- `switch syslog <on/off>` (rawLine 7777) -- write.
// ---------------------------------------------------------------------------

export interface SwitchSyslogInput {
  readonly enabled: boolean;
}

function buildSyslogFrames(input: SwitchSyslogInput): readonly CommandFrame[] {
  return [frameSingleCommand(`switch syslog ${input.enabled ? "on" : "off"}`)];
}

export const switchSyslog: TypedOperation<SwitchSyslogInput, RawCommandOutput> = {
  manifestId: "cli.switch.syslog",
  classification: "write",
  buildFrames: buildSyslogFrames,
  parse: (exchanges) => parseSyslog(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  switchStatus,
  switchOn,
  switchOff,
  switchList,
  switchQuery,
  switchI,
  switchNotRespond,
  switchClear,
  switchSyslog,
];
