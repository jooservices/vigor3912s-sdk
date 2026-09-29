/**
 * `wan` domain -- Wave 4 Item5-wan (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements classified `cli.wan.*` entries including previously deferred
 * `DF_check`, `lbel` (+ status), and `multifno` (+ status).
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
 * `internal/parsers/wan/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature). Multi-variant documented syntaxes under one heading (e.g.
 * `wan vlan`, `wan budget`, `wan failover`) are modelled as a discriminated
 * `action`/`kind` union input, one canonical frame per variant -- this is
 * still exactly one `TypedOperation` per manifest entry, not an invented
 * extra command.
 */

import { InvalidInputError } from "../errors.js";
import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseBudget } from "../internal/parsers/wan/budget.js";
import { parseDetectMtu } from "../internal/parsers/wan/detectmtu.js";
import { parseDetectMtu6 } from "../internal/parsers/wan/detectmtu6.js";
import { parseDetect } from "../internal/parsers/wan/detect.js";
import { parseDisable } from "../internal/parsers/wan/disable.js";
import { parseDns } from "../internal/parsers/wan/dns.js";
import { parseEnable } from "../internal/parsers/wan/enable.js";
import { parseFailover } from "../internal/parsers/wan/failover.js";
import { parseForward } from "../internal/parsers/wan/forward.js";
import { parseLb } from "../internal/parsers/wan/lb.js";
import { parseMtu } from "../internal/parsers/wan/mtu.js";
import { parseMvlan } from "../internal/parsers/wan/mvlan.js";
import { parsePppMru } from "../internal/parsers/wan/pppmru.js";
import { parseVlan } from "../internal/parsers/wan/vlan.js";
import { parseWanStatus, type WanStatusReport } from "../internal/parsers/wan/status.js";
import { parseDfCheck } from "../internal/parsers/wan/dfcheck.js";
import { parseLbelStatus } from "../internal/parsers/wan/lbel-status.js";
import { parseLbel } from "../internal/parsers/wan/lbel.js";
import { parseMultifnoStatus } from "../internal/parsers/wan/multifno-status.js";
import { parseMultifno } from "../internal/parsers/wan/multifno.js";
import { parseRawText, type RawCommandOutput } from "../internal/parsers/wan/shared.js";
import {
  assertCliValue,
  assertIntegerInRange,
  assertIpv4,
  assertNonNegativeInteger,
  assertNumberOneOf,
  assertOneOf,
  assertPositiveInteger,
  defineCommandOperation,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

/** WAN interface index range used across this router's documented `wan *` commands where no narrower range is given (e.g. `wan budget wan <#>` / `wan failover ... index`: "1 to 12"). */
const GENERIC_WAN_INDEX_MIN = 1;
const GENERIC_WAN_INDEX_MAX = 12;

const WAN_LABEL_PATTERN = /^wan(1[0-2]|[1-9])$/;

function assertWanLabel(value: string, name: string): void {
  if (!WAN_LABEL_PATTERN.test(value)) {
    throw new InvalidInputError(`${name} must match "wan1".."wan12" (got "${value}").`);
  }
}

// ---------------------------------------------------------------------------
// cli.wan.pppmru -- `wan ppp_mru <WAN interface number> <MRU size>` (rawLine 10778)
// ---------------------------------------------------------------------------

export interface WanPppMruInput {
  readonly wanInterface: number;
  readonly mruSize: number;
}

function buildPppMruFrames(input: WanPppMruInput): readonly CommandFrame[] {
  assertIntegerInRange(
    input.wanInterface,
    GENERIC_WAN_INDEX_MIN,
    GENERIC_WAN_INDEX_MAX,
    "wanInterface",
  );
  assertIntegerInRange(input.mruSize, 1400, 1600, "mruSize");

  return [frameSingleCommand(`wan ppp_mru ${String(input.wanInterface)} ${String(input.mruSize)}`)];
}

export const wanPppMru: TypedOperation<WanPppMruInput, RawCommandOutput> = {
  manifestId: "cli.wan.pppmru",
  classification: "write",
  buildFrames: buildPppMruFrames,
  parse: (exchanges) => parsePppMru(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.mtu.mtu2 -- `wan mtu <value>` / `wan mtu2 <value>` (rawLine 10804)
// ---------------------------------------------------------------------------

export interface WanMtuInput {
  readonly target: "mtu" | "mtu2";
  readonly value: number;
}

function buildMtuFrames(input: WanMtuInput): readonly CommandFrame[] {
  assertOneOf(input.target, ["mtu", "mtu2"], "target");
  assertIntegerInRange(input.value, 1000, 1500, "value");

  return [frameSingleCommand(`wan ${input.target} ${String(input.value)}`)];
}

export const wanMtu: TypedOperation<WanMtuInput, RawCommandOutput> = {
  manifestId: "cli.wan.mtu.mtu2",
  classification: "write",
  buildFrames: buildMtuFrames,
  parse: (exchanges) => parseMtu(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.dns -- `wan dns <wan_no><dns_select><ipv4_addr>` (rawLine 10824)
// ---------------------------------------------------------------------------

export interface WanDnsInput {
  readonly wanNo: number;
  readonly dnsSelect: "pri" | "sec";
  readonly ipv4Address: string;
}

function buildDnsFrames(input: WanDnsInput): readonly CommandFrame[] {
  assertIntegerInRange(input.wanNo, 1, 10, "wanNo");
  assertOneOf(input.dnsSelect, ["pri", "sec"], "dnsSelect");
  assertIpv4(input.ipv4Address, "ipv4Address");

  return [
    frameSingleCommand(`wan dns ${String(input.wanNo)} ${input.dnsSelect} ${input.ipv4Address}`),
  ];
}

export const wanDns: TypedOperation<WanDnsInput, RawCommandOutput> = {
  manifestId: "cli.wan.dns",
  classification: "write",
  buildFrames: buildDnsFrames,
  parse: (exchanges) => parseDns(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.disable / cli.wan.enable -- `wan disable WAN<n>` / `wan enable WAN<n>`
// (rawLine 10863 / 10868; `command-map.md`: "wan enable WAN<n> / wan disable")
// ---------------------------------------------------------------------------

export interface WanInterfaceIndexInput {
  readonly wanInterface: number;
}

function buildDisableFrames(input: WanInterfaceIndexInput): readonly CommandFrame[] {
  assertIntegerInRange(
    input.wanInterface,
    GENERIC_WAN_INDEX_MIN,
    GENERIC_WAN_INDEX_MAX,
    "wanInterface",
  );

  return [frameSingleCommand(`wan disable WAN${String(input.wanInterface)}`)];
}

export const wanDisable: TypedOperation<WanInterfaceIndexInput, RawCommandOutput> = {
  manifestId: "cli.wan.disable",
  classification: "write",
  buildFrames: buildDisableFrames,
  parse: (exchanges) => parseDisable(firstExchangeText(exchanges)),
};

function buildEnableFrames(input: WanInterfaceIndexInput): readonly CommandFrame[] {
  assertIntegerInRange(
    input.wanInterface,
    GENERIC_WAN_INDEX_MIN,
    GENERIC_WAN_INDEX_MAX,
    "wanInterface",
  );

  return [frameSingleCommand(`wan enable WAN${String(input.wanInterface)}`)];
}

export const wanEnable: TypedOperation<WanInterfaceIndexInput, RawCommandOutput> = {
  manifestId: "cli.wan.enable",
  classification: "write",
  buildFrames: buildEnableFrames,
  parse: (exchanges) => parseEnable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.forward -- `wan forward <on/off>` (rawLine 10873)
// ---------------------------------------------------------------------------

export interface WanForwardInput {
  readonly state: "on" | "off";
}

function buildForwardFrames(input: WanForwardInput): readonly CommandFrame[] {
  assertOneOf(input.state, ["on", "off"], "state");

  return [frameSingleCommand(`wan forward ${input.state}`)];
}

export const wanForward: TypedOperation<WanForwardInput, RawCommandOutput> = {
  manifestId: "cli.wan.forward",
  classification: "write",
  buildFrames: buildForwardFrames,
  parse: (exchanges) => parseForward(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.status -- `wan status` (rawLine 10890) -- read
// ---------------------------------------------------------------------------

function buildStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("wan status")];
}

export const wanStatus: TypedOperation<void, WanStatusReport> = {
  manifestId: "cli.wan.status",
  classification: "read",
  buildFrames: buildStatusFrames,
  parse: (exchanges) => parseWanStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.detect -- `wan detect status` (rawLine 10937) -- read-only query
// only.
//
// Sibling-live-verified correction (root audit, 2026-09-13,
// `ARCHITECTURE.md`'s "sibling-live-verified" amendment): the manifest entry
// `cli.wan.detect` is classified `"read"` from `vigor3912s-mcp`'s
// live-verified fw 4.4.7_RC2 `wan_detect` tool, correcting the prior
// `command-map-family` `"write"` classification.
//
// S2 (`IMPLEMENTATION.md`, `BACKLOG.md` "Tracked follow-up" 2026-09-13): the
// heading's mode-setting sub-form (`wan detect <wan#>
// <on/off/strict/always_on>`) now has its own accurately classified manifest
// entry below (`cli.wan.detect.mode`, via `SPLIT_FAMILIES`). The `-t`/`-i`
// timers and target/target_gw/ttl/interval/retry sub-forms stay a deliberate
// YAGNI deferral (not named in this task's scope).
// ---------------------------------------------------------------------------

function buildDetectFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("wan detect status")];
}

export const wanDetect: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.wan.detect",
  classification: "read",
  buildFrames: buildDetectFrames,
  parse: (exchanges) => parseDetect(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.detect.mode -- `wan detect <wan1/wan2/...> <on/off/strict/
// always_on>` plus the ARP-mode timers `wan detect <wan1> off -t <time>` /
// `-i <Interval>` (rawLine 10925-10927; time 0..256, interval 0..time).
// ---------------------------------------------------------------------------

const WAN_DETECT_MODES = ["on", "off", "strict", "always_on"] as const;

export type WanDetectModeInput =
  | {
      readonly wanInterface: string;
      readonly mode: Exclude<(typeof WAN_DETECT_MODES)[number], "off">;
    }
  | {
      readonly wanInterface: string;
      readonly mode: "off";
      /** ARP detection send time (`-t`, 0..256). */
      readonly timeSeconds?: number;
      /** ARP detection interval (`-i`, 0..time). */
      readonly intervalSeconds?: number;
    };

function buildDetectModeFrames(input: WanDetectModeInput): readonly CommandFrame[] {
  assertWanLabel(input.wanInterface, "wanInterface");
  assertOneOf(input.mode, WAN_DETECT_MODES, "mode");

  const base = `wan detect ${input.wanInterface} ${input.mode}`;

  if (input.mode !== "off") {
    return [frameSingleCommand(base)];
  }

  if (input.timeSeconds !== undefined && input.intervalSeconds !== undefined) {
    throw new InvalidInputError(
      "timeSeconds and intervalSeconds are separate commands; pass only one.",
    );
  }

  if (input.timeSeconds !== undefined) {
    assertIntegerInRange(input.timeSeconds, 0, 256, "timeSeconds");
    return [frameSingleCommand(`${base} -t ${String(input.timeSeconds)}`)];
  }

  if (input.intervalSeconds !== undefined) {
    assertIntegerInRange(input.intervalSeconds, 0, 256, "intervalSeconds");
    return [frameSingleCommand(`${base} -i ${String(input.intervalSeconds)}`)];
  }

  return [frameSingleCommand(base)];
}

export const wanDetectMode: TypedOperation<WanDetectModeInput, RawCommandOutput> = {
  manifestId: "cli.wan.detect.mode",
  classification: "write",
  buildFrames: buildDetectModeFrames,
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.detect.target / .target2 -- `wan detect <wanN> target|target2 <ip
// addr>` (rawLine 10928/10929): primary / secondary ping target.
// ---------------------------------------------------------------------------

export interface WanDetectTargetInput {
  readonly wanInterface: string;
  readonly ipv4Address: string;
}

function detectTargetOperation(
  manifestId: string,
  keyword: "target" | "target2",
): TypedOperation<WanDetectTargetInput, RawCommandOutput> {
  return {
    manifestId,
    classification: "write",
    buildFrames: (input) => {
      assertWanLabel(input.wanInterface, "wanInterface");
      assertIpv4(input.ipv4Address, "ipv4Address");

      return [
        frameSingleCommand(`wan detect ${input.wanInterface} ${keyword} ${input.ipv4Address}`),
      ];
    },
    parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
  };
}

export const wanDetectTarget = detectTargetOperation("cli.wan.detect.target", "target");
export const wanDetectTarget2 = detectTargetOperation("cli.wan.detect.target2", "target2");

// cli.wan.detect.targetgw -- `wan detect <wanN> target_gw <1/0>` (rawLine
// 10930): use the gateway as ping target.
export interface WanDetectTargetGwInput {
  readonly wanInterface: string;
  readonly enabled: boolean;
}

export const wanDetectTargetGw: TypedOperation<WanDetectTargetGwInput, RawCommandOutput> = {
  manifestId: "cli.wan.detect.targetgw",
  classification: "write",
  buildFrames: (input) => {
    assertWanLabel(input.wanInterface, "wanInterface");

    return [
      frameSingleCommand(`wan detect ${input.wanInterface} target_gw ${input.enabled ? "1" : "0"}`),
    ];
  },
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// cli.wan.detect.ttl / .interval / .retry -- `wan detect <wanN> ttl|interval|
// retry <value>` (rawLine 10934-10936): ping TTL (0 = default 255, 0..255),
// interval seconds (1..3600), retry count (1..255).
export interface WanDetectValueInput {
  readonly wanInterface: string;
  readonly value: number;
}

function detectValueOperation(
  manifestId: string,
  keyword: "ttl" | "interval" | "retry",
  min: number,
  max: number,
): TypedOperation<WanDetectValueInput, RawCommandOutput> {
  return {
    manifestId,
    classification: "write",
    buildFrames: (input) => {
      assertWanLabel(input.wanInterface, "wanInterface");
      assertIntegerInRange(input.value, min, max, "value");

      return [
        frameSingleCommand(`wan detect ${input.wanInterface} ${keyword} ${String(input.value)}`),
      ];
    },
    parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
  };
}

export const wanDetectTtl = detectValueOperation("cli.wan.detect.ttl", "ttl", 0, 255);
export const wanDetectInterval = detectValueOperation(
  "cli.wan.detect.interval",
  "interval",
  1,
  3600,
);
export const wanDetectRetry = detectValueOperation("cli.wan.detect.retry", "retry", 1, 255);

// ---------------------------------------------------------------------------
// cli.wan.lb -- `wan lb <wan1/wan2/...> <on/off>` (rawLine 11010) -- canonical
// membership-toggle variant only (`wan lb <ip/session>` and `wan lb status`
// are a deliberate YAGNI deferral).
// ---------------------------------------------------------------------------

export interface WanLbInput {
  readonly wanInterface: string;
  readonly state: "on" | "off";
}

function buildLbFrames(input: WanLbInput): readonly CommandFrame[] {
  assertWanLabel(input.wanInterface, "wanInterface");
  assertOneOf(input.state, ["on", "off"], "state");

  return [frameSingleCommand(`wan lb ${input.wanInterface} ${input.state}`)];
}

export const wanLb: TypedOperation<WanLbInput, RawCommandOutput> = {
  manifestId: "cli.wan.lb",
  classification: "write",
  buildFrames: buildLbFrames,
  parse: (exchanges) => parseLb(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.mvlan -- `wan mvlan <pvc_no> <on/off> [px ...]` (rawLine 11120) --
// canonical bridge-toggle variant documented by the heading's own example
// (`wan mvlan 7 on p2 p3 p4`); `status`/`save`/`enable`/`disable`/`clear`/
// `tag` sub-forms are a deliberate YAGNI deferral.
// ---------------------------------------------------------------------------

export interface WanMvlanInput {
  readonly pvcNo: number;
  readonly state: "on" | "off";
  readonly ports?: readonly number[];
}

function buildMvlanFrames(input: WanMvlanInput): readonly CommandFrame[] {
  assertIntegerInRange(input.pvcNo, 2, 7, "pvcNo");
  assertOneOf(input.state, ["on", "off"], "state");

  const ports = input.ports ?? [];

  for (const port of ports) {
    assertIntegerInRange(port, 2, 4, "each port in ports");
  }

  const portsSuffix =
    ports.length > 0 ? ` ${ports.map((port) => `p${String(port)}`).join(" ")}` : "";

  return [frameSingleCommand(`wan mvlan ${String(input.pvcNo)} ${input.state}${portsSuffix}`)];
}

export const wanMvlan: TypedOperation<WanMvlanInput, RawCommandOutput> = {
  manifestId: "cli.wan.mvlan",
  classification: "write",
  buildFrames: buildMvlanFrames,
  parse: (exchanges) => parseMvlan(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.vlan -- `wan vlan wan <#> tag <value>` / `<enable/disable>` /
// `pri <value>` (rawLine 11191 -- the indented heading the manifest
// generator's census test specifically checks for). `wan vlan stat` is a
// deliberate YAGNI deferral (it is the family's `wan status`-shaped read
// variant of this heading; not modelled here alongside the write forms).
// ---------------------------------------------------------------------------

export type WanVlanInput =
  | { readonly wanInterface: number; readonly action: "tag"; readonly tagValue: number }
  | { readonly wanInterface: number; readonly action: "state"; readonly enabled: boolean }
  | { readonly wanInterface: number; readonly action: "priority"; readonly priority: number };

function buildVlanFrames(input: WanVlanInput): readonly CommandFrame[] {
  assertIntegerInRange(
    input.wanInterface,
    GENERIC_WAN_INDEX_MIN,
    GENERIC_WAN_INDEX_MAX,
    "wanInterface",
  );

  const prefix = `wan vlan wan ${String(input.wanInterface)}`;

  switch (input.action) {
    case "tag": {
      if (input.tagValue !== -1) {
        assertIntegerInRange(input.tagValue, 1, 4095, "tagValue");
      }

      return [frameSingleCommand(`${prefix} tag ${String(input.tagValue)}`)];
    }
    case "state": {
      return [frameSingleCommand(`${prefix} ${input.enabled ? "enable" : "disable"}`)];
    }
    case "priority": {
      assertIntegerInRange(input.priority, 0, 7, "priority");

      return [frameSingleCommand(`${prefix} pri ${String(input.priority)}`)];
    }
  }
}

export const wanVlan: TypedOperation<WanVlanInput, RawCommandOutput> = {
  manifestId: "cli.wan.vlan",
  classification: "write",
  buildFrames: buildVlanFrames,
  parse: (exchanges) => parseVlan(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.budget -- `wan budget wan <#> <enable|disable>` /
// `thres <MB>` / `gthres <GB>` (rawLine 11223) -- `rdate`/`mode`/`psday`/
// `custom_mode*`/`action`/`status` sub-forms are a deliberate YAGNI deferral.
// ---------------------------------------------------------------------------

export type WanBudgetInput =
  | { readonly wanInterface: number; readonly action: "state"; readonly enabled: boolean }
  | { readonly wanInterface: number; readonly action: "thresholdMb"; readonly limitMb: number }
  | { readonly wanInterface: number; readonly action: "thresholdGb"; readonly limitGb: number }
  | {
      /** Refresh time: day 1..30, hour 1..23 (monthly: that day/hour; periodic: every N days + H hours). */
      readonly wanInterface: number;
      readonly action: "refreshDate";
      readonly day: number;
      readonly hour: number;
    }
  | {
      readonly wanInterface: number;
      readonly action: "mode";
      readonly mode: "monthly" | "periodic" | "none";
    }
  | {
      /** Periodic mode: today is the Nth day of the billing cycle. */
      readonly wanInterface: number;
      readonly action: "periodStartDay";
      readonly day: number;
    }
  | {
      /** 0 cycle in hours, 1 cycle in days. */
      readonly wanInterface: number;
      readonly action: "customMode";
      readonly customMode: 0 | 1;
    }
  | { readonly wanInterface: number; readonly action: "customModeResetHour"; readonly hour: number }
  | {
      /** Bitmap: 1 shut down WAN, 2 mail alert, 4 SMS alert (sum to combine). */
      readonly wanInterface: number;
      readonly action: "limitAction";
      readonly bitmap: number;
    };

function buildBudgetFrames(input: WanBudgetInput): readonly CommandFrame[] {
  assertIntegerInRange(input.wanInterface, 1, 12, "wanInterface");

  const prefix = `wan budget wan ${String(input.wanInterface)}`;

  switch (input.action) {
    case "state": {
      return [frameSingleCommand(`${prefix} ${input.enabled ? "enable" : "disable"}`)];
    }
    case "thresholdMb": {
      assertPositiveInteger(input.limitMb, "limitMb");

      return [frameSingleCommand(`${prefix} thres ${String(input.limitMb)}`)];
    }
    case "thresholdGb": {
      assertPositiveInteger(input.limitGb, "limitGb");

      return [frameSingleCommand(`${prefix} gthres ${String(input.limitGb)}`)];
    }
    case "refreshDate": {
      assertIntegerInRange(input.day, 1, 30, "day");
      assertIntegerInRange(input.hour, 1, 23, "hour");

      return [frameSingleCommand(`${prefix} rdate ${String(input.day)} ${String(input.hour)}`)];
    }
    case "mode": {
      assertOneOf(input.mode, ["monthly", "periodic", "none"], "mode");

      return [frameSingleCommand(`${prefix} mode ${input.mode}`)];
    }
    case "periodStartDay": {
      assertPositiveInteger(input.day, "day");

      return [frameSingleCommand(`${prefix} psday ${String(input.day)}`)];
    }
    case "customMode": {
      assertNumberOneOf(input.customMode, [0, 1], "customMode");

      return [frameSingleCommand(`${prefix} custom_mode ${String(input.customMode)}`)];
    }
    case "customModeResetHour": {
      assertIntegerInRange(input.hour, 1, 23, "hour");

      return [frameSingleCommand(`${prefix} custom_mode_reset_hour ${String(input.hour)}`)];
    }
    case "limitAction": {
      assertIntegerInRange(input.bitmap, 0, 7, "bitmap");

      return [frameSingleCommand(`${prefix} action ${String(input.bitmap)}`)];
    }
  }
}

export const wanBudget: TypedOperation<WanBudgetInput, RawCommandOutput> = {
  manifestId: "cli.wan.budget",
  classification: "write",
  buildFrames: buildBudgetFrames,
  parse: (exchanges) => parseBudget(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.detectmtu -- `wan detect_mtu -i <host> -s <mtu_size> -d <decrease>
// -w <wan#> -c <count>` (rawLine 11287) -- an active network probe (measures
// path MTU by sending test packets), not a configuration mutation.
//
// Sibling-live-verified correction (root audit, 2026-09-13): the manifest
// entry is now classified `"read"` from `vigor3912s-mcp`'s live-verified
// `wan_detect_mtu`, correcting the prior `command-map-family` `"write"`
// classification. Unlike `cli.wan.detect` above, this command has no
// separate mutating sub-form to narrow away -- it is inherently a diagnostic
// probe (comparable to `ip ping`/`ip tracert`, `ARCH#Item-3`'s diagnostic
// exception), so the input shape is unchanged, only the classification.
// ---------------------------------------------------------------------------

export interface WanDetectMtuInput {
  readonly host: string;
  readonly mtuSize: number;
  readonly decreaseSize: number;
  readonly wanInterface: number;
  readonly count: number;
}

function buildDetectMtuFrames(input: WanDetectMtuInput): readonly CommandFrame[] {
  assertCliValue(input.host, "host");
  assertIntegerInRange(input.mtuSize, 1000, 1500, "mtuSize");
  assertIntegerInRange(input.decreaseSize, 1, 100, "decreaseSize");
  assertIntegerInRange(
    input.wanInterface,
    GENERIC_WAN_INDEX_MIN,
    GENERIC_WAN_INDEX_MAX,
    "wanInterface",
  );
  assertIntegerInRange(input.count, 1, 10, "count");

  return [
    frameSingleCommand(
      `wan detect_mtu -i ${input.host} -s ${String(input.mtuSize)} -d ${String(input.decreaseSize)} -w ${String(input.wanInterface)} -c ${String(input.count)}`,
    ),
  ];
}

export const wanDetectMtu: TypedOperation<WanDetectMtuInput, RawCommandOutput> = {
  manifestId: "cli.wan.detectmtu",
  classification: "read",
  buildFrames: buildDetectMtuFrames,
  parse: (exchanges) => parseDetectMtu(firstExchangeText(exchanges)),
  // Active network probe, same category as `ip ping`/`ip tracert`
  // (`ARCHITECTURE.md` Item 3's diagnostic exception) — can legitimately run
  // longer than the 15s default.
  executionOverride: { commandTimeoutMs: 60_000 },
};

// ---------------------------------------------------------------------------
// cli.wan.detectmtu6 -- `wan detect_mtu6 -i <host> -s <mtu_size> -w <wan#>`
// (rawLine 11313) -- an active IPv6 path-MTU probe, not a configuration
// mutation (same reasoning as `cli.wan.detectmtu` above).
//
// Sibling-live-verified correction (root audit, 2026-09-13): the manifest
// entry is now classified `"read"` from `vigor3912s-mcp`'s live-verified
// `wan_detect_mtu6`, correcting the prior `command-map-family` `"write"`
// classification; input shape unchanged.
// ---------------------------------------------------------------------------

export interface WanDetectMtu6Input {
  readonly host: string;
  readonly mtuSize: number;
  readonly wanInterface: number;
}

function buildDetectMtu6Frames(input: WanDetectMtu6Input): readonly CommandFrame[] {
  assertCliValue(input.host, "host");
  assertIntegerInRange(input.mtuSize, 1280, 1500, "mtuSize");
  assertIntegerInRange(
    input.wanInterface,
    GENERIC_WAN_INDEX_MIN,
    GENERIC_WAN_INDEX_MAX,
    "wanInterface",
  );

  return [
    frameSingleCommand(
      `wan detect_mtu6 -i ${input.host} -s ${String(input.mtuSize)} -w ${String(input.wanInterface)}`,
    ),
  ];
}

export const wanDetectMtu6: TypedOperation<WanDetectMtu6Input, RawCommandOutput> = {
  manifestId: "cli.wan.detectmtu6",
  classification: "read",
  buildFrames: buildDetectMtu6Frames,
  parse: (exchanges) => parseDetectMtu6(firstExchangeText(exchanges)),
  // Active network probe, same category as `ip ping`/`ip tracert`
  // (`ARCHITECTURE.md` Item 3's diagnostic exception) — can legitimately run
  // longer than the 15s default.
  executionOverride: { commandTimeoutMs: 60_000 },
};

// ---------------------------------------------------------------------------
// cli.wan.failover -- `wan failover off <index>` / `wan failover show
// <index>` / `wan failover on <1><2><3><4><5><6>` (rawLine 11335); `newlb`
// sub-form is a deliberate YAGNI deferral.
// ---------------------------------------------------------------------------

/** `wan failover newlb` threshold flags (rawLine 11335): a/u/d/l/j/p are 0/1 switches, m/n/x/y/z values. */
const NEWLB_SWITCH_FLAGS = ["a", "u", "d", "l", "j", "p"] as const;
const NEWLB_VALUE_FLAGS = ["m", "n", "x", "y", "z"] as const;

export interface WanFailoverNewLbSetting {
  /**
   * a all-meet(1)/any-meet(0); u/d/l/j/p check upload/download/latency/
   * jitter/packet loss (0/1); m/n upload/download threshold, x latency,
   * y jitter, z packet-loss threshold value.
   */
  readonly flag: (typeof NEWLB_SWITCH_FLAGS)[number] | (typeof NEWLB_VALUE_FLAGS)[number];
  readonly value: number;
}

export type WanFailoverInput =
  | {
      readonly action: "newlb";
      readonly index: number;
      readonly settings: readonly WanFailoverNewLbSetting[];
    }
  | { readonly action: "off"; readonly index: number }
  | { readonly action: "show"; readonly index: number }
  | {
      readonly action: "on";
      readonly failoverWan: number;
      readonly disconnectActionEnabled: boolean;
      readonly anyOrAllActionEnabled: boolean;
      readonly mainWan: number;
      readonly downloadThresholdKbps: number;
      readonly uploadThresholdKbps: number;
    };

function buildFailoverFrames(input: WanFailoverInput): readonly CommandFrame[] {
  switch (input.action) {
    case "off": {
      assertIntegerInRange(input.index, 1, 12, "index");

      return [frameSingleCommand(`wan failover off ${String(input.index)}`)];
    }
    case "show": {
      assertIntegerInRange(input.index, 1, 12, "index");

      return [frameSingleCommand(`wan failover show ${String(input.index)}`)];
    }
    case "on": {
      assertIntegerInRange(input.failoverWan, 1, 7, "failoverWan");
      assertIntegerInRange(input.mainWan, 1, 7, "mainWan");
      assertNonNegativeInteger(input.downloadThresholdKbps, "downloadThresholdKbps");
      assertNonNegativeInteger(input.uploadThresholdKbps, "uploadThresholdKbps");

      const disconnectFlag = input.disconnectActionEnabled ? 1 : 0;
      const anyOrAllFlag = input.anyOrAllActionEnabled ? 1 : 0;

      return [
        frameSingleCommand(
          `wan failover on ${String(input.failoverWan)} ${String(disconnectFlag)} ${String(anyOrAllFlag)} ${String(input.mainWan)} ${String(input.downloadThresholdKbps)} ${String(input.uploadThresholdKbps)}`,
        ),
      ];
    }
    case "newlb": {
      assertIntegerInRange(input.index, 1, 12, "index");

      if (input.settings.length === 0) {
        throw new InvalidInputError("settings must contain at least one flag.");
      }

      const parts = input.settings.map(({ flag, value }) => {
        if ((NEWLB_SWITCH_FLAGS as readonly string[]).includes(flag)) {
          assertIntegerInRange(value, 0, 1, `-${flag}`);
        } else {
          assertOneOf(flag, NEWLB_VALUE_FLAGS, "flag");
          assertIntegerInRange(value, 0, 1_000_000, `-${flag}`);
        }

        return `-${flag} ${String(value)}`;
      });

      return [frameSingleCommand(`wan failover newlb ${String(input.index)} ${parts.join(" ")}`)];
    }
  }
}

export const wanFailover: TypedOperation<WanFailoverInput, RawCommandOutput> = {
  manifestId: "cli.wan.failover",
  classification: "write",
  buildFrames: buildFailoverFrames,
  parse: (exchanges) => parseFailover(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.dfcheck -- `wan DF_check <on/off>` (rawLine 10852) -- write.
// ---------------------------------------------------------------------------

export interface WanDfCheckInput {
  readonly enabled: boolean;
}

function buildDfCheckFrames(input: WanDfCheckInput): readonly CommandFrame[] {
  return [frameSingleCommand(`wan DF_check ${input.enabled ? "on" : "off"}`)];
}

export const wanDfCheck: TypedOperation<WanDfCheckInput, RawCommandOutput> = {
  manifestId: "cli.wan.dfcheck",
  classification: "write",
  buildFrames: buildDfCheckFrames,
  parse: (exchanges) => parseDfCheck(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.lbel.status -- `wan lbel status <idx>` (rawLine 11036) -- read.
// ---------------------------------------------------------------------------

export interface WanLbelStatusInput {
  readonly index: number;
}

function buildLbelStatusFrames(input: WanLbelStatusInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, 1, 32, "index");

  return [frameSingleCommand(`wan lbel status ${String(input.index)}`)];
}

export const wanLbelStatus: TypedOperation<WanLbelStatusInput, RawCommandOutput> = {
  manifestId: "cli.wan.lbel.status",
  classification: "read",
  buildFrames: buildLbelStatusFrames,
  parse: (exchanges) => parseLbelStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.lbel -- documented positional write form (rawLine 11036).
// ---------------------------------------------------------------------------

export interface WanLbelInput {
  readonly index: number;
  readonly enabled: boolean;
  readonly protocol: "tcp" | "udp" | "all";
  readonly ipType: 0 | 1 | 2;
  readonly objectOrGroupIndex: number;
  readonly portStart: number;
  readonly portEnd: number;
  readonly comment: string;
}

function buildLbelFrames(input: WanLbelInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, 1, 32, "index");
  assertOneOf(input.protocol, ["tcp", "udp", "all"], "protocol");
  if (![0, 1, 2].includes(input.ipType)) {
    throw new InvalidInputError(`ipType must be one of 0, 1, 2 (got ${String(input.ipType)}).`);
  }
  assertIntegerInRange(input.objectOrGroupIndex, 0, 500, "objectOrGroupIndex");
  assertIntegerInRange(input.portStart, 0, 65535, "portStart");
  assertIntegerInRange(input.portEnd, 0, 65535, "portEnd");
  assertCliValue(input.comment, "comment");

  // Vendor text says "less than 11 characters" but the worked example uses
  // `testforload` (11 chars); accept up to 11 to match that example.
  if (input.comment.length > 11) {
    throw new InvalidInputError(
      `comment must be at most 11 characters (got ${String(input.comment.length)}).`,
    );
  }

  return [
    frameSingleCommand(
      `wan lbel ${String(input.index)} ${input.enabled ? "1" : "0"} ${input.protocol} ${String(input.ipType)} ${String(input.objectOrGroupIndex)} ${String(input.portStart)} ${String(input.portEnd)} ${input.comment}`,
    ),
  ];
}

export const wanLbel: TypedOperation<WanLbelInput, RawCommandOutput> = {
  manifestId: "cli.wan.lbel",
  classification: "write",
  buildFrames: buildLbelFrames,
  parse: (exchanges) => parseLbel(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.multifno.status -- `wan multifno status` (rawLine 11158) -- read.
// ---------------------------------------------------------------------------

function buildMultifnoStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("wan multifno status")];
}

export const wanMultifnoStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.wan.multifno.status",
  classification: "read",
  buildFrames: buildMultifnoStatusFrames,
  parse: (exchanges) => parseMultifnoStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.wan.multifno -- `wan multifno <channel> <WAN#>` (rawLine 11158) -- write.
// ---------------------------------------------------------------------------

export interface WanMultifnoInput {
  readonly channel: number;
  readonly wanInterface: number;
}

function buildMultifnoFrames(input: WanMultifnoInput): readonly CommandFrame[] {
  assertIntegerInRange(input.channel, 13, 52, "channel");
  assertIntegerInRange(input.wanInterface, 1, 20, "wanInterface");

  return [
    frameSingleCommand(`wan multifno ${String(input.channel)} ${String(input.wanInterface)}`),
  ];
}

export const wanMultifno: TypedOperation<WanMultifnoInput, RawCommandOutput> = {
  manifestId: "cli.wan.multifno",
  classification: "write",
  buildFrames: buildMultifnoFrames,
  parse: (exchanges) => parseMultifno(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// Sub-form completion (S8).
// ---------------------------------------------------------------------------

// `wan lb <ip/session>` (rawLine 11010): load-balance mode.
export interface WanLbModeInput {
  readonly mode: "ip" | "session";
}

export const wanLbMode = defineRawOperation<WanLbModeInput>("cli.wan.lb.mode", "write", (input) => {
  assertOneOf(input.mode, ["ip", "session"], "mode");
  return `wan lb ${input.mode}`;
});

export const wanLbStatus = defineCommandOperation("cli.wan.lb.status", "read", "wan lb status");

// `wan vlan stat` (rawLine 11191): current WAN VLAN tagging.
export const wanVlanStat = defineCommandOperation("cli.wan.vlan.stat", "read", "wan vlan stat");

// `wan budget status` (rawLine 11223): WAN budget configuration.
export const wanBudgetStatus = defineCommandOperation(
  "cli.wan.budget.status",
  "read",
  "wan budget status",
);

// ---------------------------------------------------------------------------
// Live-firmware-recon operations (fw 4.4.7_RC2 `?` help, owner capture in
// `references/live-help-fw-4.4.7_RC2.txt`); absent from the Part VIII PDF.
// ---------------------------------------------------------------------------

export interface WanDpdkPortInput {
  readonly wanNo: number;
  readonly portId: number;
}

export const wanDpdkPort = defineRawOperation<WanDpdkPortInput>(
  "cli.wan.dpdkport",
  "write",
  (input) => {
    assertIntegerInRange(input.wanNo, 1, 12, "wanNo");
    assertIntegerInRange(input.portId, 0, 64, "portId");
    return `wan dpdk-port ${String(input.wanNo)} ${String(input.portId)}`;
  },
);

export interface WanDropInput {
  /** `wan1`..`wan12`. */
  readonly wanInterface: string;
}

/** Drops a WAN connection. */
export const wanDrop = defineRawOperation<WanDropInput>("cli.wan.drop", "destructive", (input) => {
  if (!/^wan([1-9]|1[0-2])$/.test(input.wanInterface)) {
    throw new InvalidInputError(
      `wanInterface must match "wan1".."wan12" (got "${input.wanInterface}").`,
    );
  }

  return `wan drop ${input.wanInterface}`;
});

/** A `-<flag> <value>` setting with an inclusive integer range per flag. */
export interface WanFlagSetting {
  readonly flag: string;
  readonly value: number | string;
}

function renderFlagSettings(
  settings: readonly WanFlagSetting[],
  ranges: Readonly<Record<string, readonly [number, number] | "ipv4">>,
): string {
  if (settings.length === 0) {
    throw new InvalidInputError("settings must contain at least one flag.");
  }

  return settings
    .map(({ flag, value }) => {
      const range = Object.hasOwn(ranges, flag) ? ranges[flag] : undefined;

      if (range === undefined) {
        throw new InvalidInputError(
          `flag must be one of ${Object.keys(ranges).join(", ")} (got "${flag}").`,
        );
      }

      if (range === "ipv4") {
        assertIpv4(String(value), `-${flag}`);
      } else {
        assertIntegerInRange(Number(value), range[0], range[1], `-${flag}`);
      }

      return `-${flag} ${String(value)}`;
    })
    .join(" ");
}

const DETECT2_FLAGS = {
  w: [1, 12],
  x: [1, 500],
  p: [1, 32],
  t: [0, 2],
  i: "ipv4",
  j: "ipv4",
  k: [1, 20],
  g: [0, 1],
  d: [0, 65535],
  v: [1, 65535],
  r: [1, 255],
  l: [1, 255],
  b: [1, 500],
} as const;

export interface WanDetect2Input {
  /**
   * w WAN 1..12, x VPN 1..500, p profile 1..32, t type (0 off, 1 ICMP,
   * 2 TCP), i/j first/second server IP, k HTTP hostname index 1..20, g
   * gateway as third server, d ICMP id / TCP port, v interval s, r retry,
   * l retry delay s, b hub VPN ifno.
   */
  readonly settings: readonly WanFlagSetting[];
}

export const wanDetect2 = defineRawOperation<WanDetect2Input>(
  "cli.wan.detect2",
  "write",
  (input) => `wan detect2 ${renderFlagSettings(input.settings, DETECT2_FLAGS)}`,
);
export const wanDetect2Show = defineCommandOperation(
  "cli.wan.detect2.show",
  "read",
  "wan detect2 -s",
);
export const wanDetect2Result = defineCommandOperation(
  "cli.wan.detect2.result",
  "read",
  "wan detect2 -u",
);

const LBWEIGHT_FLAGS = {
  u: [1, 3],
  d: [1, 3],
  l: [1, 3],
  j: [1, 3],
  p: [1, 3],
  t: [0, 3],
} as const;

export interface WanLbWeightInput {
  /** u/d/l/j/p upload/download/latency/jitter/packet-loss priority (3 high, 2 median, 1 low); t template 0..3. */
  readonly settings: readonly WanFlagSetting[];
}

export const wanLbWeight = defineRawOperation<WanLbWeightInput>(
  "cli.wan.lbweight",
  "write",
  (input) => `wan lbweight ${renderFlagSettings(input.settings, LBWEIGHT_FLAGS)}`,
);
export const wanLbWeightStatus = defineCommandOperation(
  "cli.wan.lbweight.status",
  "read",
  "wan lbweight -s",
);

export type WanVoipDetectInput =
  | { readonly option: "enable"; readonly enabled: boolean }
  | {
      /** `-t` threshold MOS 2.0..4.0 / `-b` better-WAN margin 0.1..1.0. */
      readonly option: "threshold" | "better";
      readonly mos: number;
    }
  | { readonly option: "debugWan"; readonly wan: number };

export const wanVoipDetect = defineRawOperation<WanVoipDetectInput>(
  "cli.wan.voipdect",
  "write",
  (input) => {
    switch (input.option) {
      case "enable":
        return `wan voipdect -e ${input.enabled ? "1" : "0"}`;
      case "threshold":
      case "better": {
        const [min, max] = input.option === "threshold" ? [2, 4] : [0.1, 1];

        if (!Number.isFinite(input.mos) || input.mos < min || input.mos > max) {
          throw new InvalidInputError(
            `mos must be between ${String(min)} and ${String(max)} (got ${String(input.mos)}).`,
          );
        }

        return `wan voipdect ${input.option === "threshold" ? "-t" : "-b"} ${input.mos.toFixed(1)}`;
      }
      case "debugWan":
        assertIntegerInRange(input.wan, 1, 12, "wan");
        return `wan voipdect -d ${String(input.wan)}`;
    }
  },
);
export const wanVoipDetectView = defineCommandOperation(
  "cli.wan.voipdect.view",
  "read",
  "wan voipdect -v",
);
export const wanVoipDetectRtp = defineCommandOperation(
  "cli.wan.voipdect.rtp",
  "read",
  "wan voipdect -i",
);

export const wanPhymodeStatus = defineCommandOperation(
  "cli.wan.phymode.status",
  "read",
  "wan phymode status",
);

export interface WanPhymodeInput {
  readonly wanNo: number;
  /** Physical mode; the firmware documents only 0 = Ethernet (WAN2 only). */
  readonly mode: 0;
}

/** Changes a WAN port's physical mode: the link drops while it switches. */
export const wanPhymode = defineRawOperation<WanPhymodeInput>(
  "cli.wan.phymode",
  "destructive",
  (input) => {
    assertIntegerInRange(input.wanNo, 1, 12, "wanNo");
    assertIntegerInRange(input.mode, 0, 0, "mode");
    return `wan phymode ${String(input.wanNo)} ${String(input.mode)}`;
  },
);

export const operations: readonly TypedOperation<never, unknown>[] = [
  wanLbMode,
  wanLbStatus,
  wanVlanStat,
  wanBudgetStatus,
  wanPppMru,
  wanMtu,
  wanDns,
  wanDisable,
  wanEnable,
  wanForward,
  wanStatus,
  wanDetect,
  wanDetectMode,
  wanDetectTarget,
  wanDetectTarget2,
  wanDetectTargetGw,
  wanDetectTtl,
  wanDetectInterval,
  wanDetectRetry,
  wanLb,
  wanMvlan,
  wanVlan,
  wanBudget,
  wanDetectMtu,
  wanDetectMtu6,
  wanFailover,
  wanDfCheck,
  wanLbelStatus,
  wanLbel,
  wanMultifnoStatus,
  wanMultifno,
  wanDpdkPort,
  wanDrop,
  wanDetect2,
  wanDetect2Show,
  wanDetect2Result,
  wanLbWeight,
  wanLbWeightStatus,
  wanVoipDetect,
  wanVoipDetectView,
  wanVoipDetectRtp,
  wanPhymodeStatus,
  wanPhymode,
];
