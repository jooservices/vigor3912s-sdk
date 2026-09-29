/**
 * `ipf` domain -- Wave 4 Item5-ipf (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements classified `cli.ipf.*` entries including previously deferred
 * `cli.ipf.flowtrack.view` / `cli.ipf.flowtrack.set`. `cli.ipf.flowtest`
 * remains blocked/unimplemented outside this task's documented set.
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
 * `internal/parsers/ipf/*.ts` (`ARCHITECTURE.md` Item 5's parser signature).
 *
 * `ipf set` and `ipf rule` each document a large option surface (see the raw
 * text at rawLine 3125 / 3600). Only a canonical subset of documented
 * sub-forms is modelled per heading, matching `domains/wan.ts`'s established
 * "canonical variant only, rest is a deliberate YAGNI deferral" precedent:
 *  - `ipf set`: only the top-level `<Options>` general-setup sub-forms
 *    (`-c`, `-d`, `-p`, `-R`, `-L`, `-C`). The `-v` view flag and the
 *    `<SET_NO><Options>` / `<SET_NO> rule <RULE_NO><Options>` forms (the
 *    latter overlapping `ipf rule` itself) are a deliberate YAGNI deferral.
 *  - `ipf rule`: only the `s r -v` / `s r -e <0/1>` / `s r -D <value>`
 *    canonical sub-forms. The remaining documented options (`-I`, `-O`,
 *    `-s`, and more) are a deliberate YAGNI deferral.
 */

import { InvalidInputError } from "../errors.js";
import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseView, type IpfViewReport } from "../internal/parsers/ipf/view.js";
import { parseSet } from "../internal/parsers/ipf/set.js";
import { parseRule } from "../internal/parsers/ipf/rule.js";
import { parseFlowtrackView } from "../internal/parsers/ipf/flowtrack-view.js";
import { parseFlowtrackSet } from "../internal/parsers/ipf/flowtrack-set.js";
import type { RawCommandOutput } from "../internal/parsers/ipf/shared.js";
import {
  assertCliValue,
  assertIntegerInRange,
  assertOneOf,
  defineCommandOperation,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

// ---------------------------------------------------------------------------
// cli.ipf.view -- `ipf view [-VcdhrtzZ]` (rawLine 3103) -- read
// ---------------------------------------------------------------------------

const IPF_VIEW_FLAGS = ["V", "c", "d", "h", "r", "t", "z", "Z"] as const;
export type IpfViewFlag = (typeof IPF_VIEW_FLAGS)[number];

export interface IpfViewInput {
  readonly flags?: readonly IpfViewFlag[];
}

function buildViewFrames(input: IpfViewInput): readonly CommandFrame[] {
  const flags = input.flags ?? [];
  const seen = new Set<IpfViewFlag>();

  for (const flag of flags) {
    assertOneOf(flag, IPF_VIEW_FLAGS, "each flag in flags");

    if (seen.has(flag)) {
      throw new InvalidInputError(`flags must not contain duplicates (got repeated "${flag}").`);
    }

    seen.add(flag);
  }

  const suffix = flags.length > 0 ? ` ${flags.map((flag) => `-${flag}`).join(" ")}` : "";

  return [frameSingleCommand(`ipf view${suffix}`)];
}

export const ipfView: TypedOperation<IpfViewInput, IpfViewReport> = {
  manifestId: "cli.ipf.view",
  classification: "read",
  buildFrames: buildViewFrames,
  parse: (exchanges) => parseView(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ipf.set -- `ipf set <Options>` (rawLine 3125): general options (`-v`,
// `-c`, `-d`, `-p`, `-R`, `-L`, `-C`) and filter-set options `ipf set
// <SET_NO> -m <comment> | -v | -n <NEXT_SET_NO>`. The per-rule form `ipf set
// <SET_NO> rule <RULE_NO> ...` is `cli.ipf.set.rule`.
// ---------------------------------------------------------------------------

export type IpfSetInput =
  | { readonly action: "callFilterSet"; readonly setNo: number }
  | { readonly action: "dataFilterSet"; readonly setNo: number }
  | { readonly action: "defaultAction"; readonly pass: boolean; readonly logToSyslog: boolean }
  | {
      readonly action: "acceptRoutingFromWan";
      readonly family: "v4" | "v6";
      readonly enabled: boolean;
    }
  | { readonly action: "strictSecurityFirewall"; readonly enabled: boolean }
  | { readonly action: "codePage"; readonly page: number }
  | { readonly action: "view" }
  | { readonly action: "filterSetView"; readonly setNo: number }
  | { readonly action: "filterSetComment"; readonly setNo: number; readonly comment: string }
  | { readonly action: "filterSetNext"; readonly setNo: number; readonly nextSetNo: number };

function buildSetFrames(input: IpfSetInput): readonly CommandFrame[] {
  switch (input.action) {
    case "callFilterSet": {
      assertIntegerInRange(input.setNo, 0, 12, "setNo");

      return [frameSingleCommand(`ipf set -c ${String(input.setNo)}`)];
    }
    case "dataFilterSet": {
      assertIntegerInRange(input.setNo, 0, 12, "setNo");

      return [frameSingleCommand(`ipf set -d ${String(input.setNo)}`)];
    }
    case "defaultAction": {
      const passFlag = input.pass ? 0 : 1;
      const syslogFlag = input.logToSyslog ? 1 : 0;

      return [frameSingleCommand(`ipf set -p ${String(passFlag)} ${String(syslogFlag)}`)];
    }
    case "acceptRoutingFromWan": {
      assertOneOf(input.family, ["v4", "v6"], "family");

      // Documented encoding: "Enter 0 (enable) or 1 (disable)".
      const enabledFlag = input.enabled ? 0 : 1;

      return [frameSingleCommand(`ipf set -R ${input.family} ${String(enabledFlag)}`)];
    }
    case "strictSecurityFirewall": {
      const enabledFlag = input.enabled ? 1 : 0;

      return [frameSingleCommand(`ipf set -L ${String(enabledFlag)}`)];
    }
    case "codePage": {
      assertIntegerInRange(input.page, 0, 20, "page");

      return [frameSingleCommand(`ipf set -C ${String(input.page)}`)];
    }
    case "view": {
      return [frameSingleCommand("ipf set -v")];
    }
    case "filterSetView": {
      assertIntegerInRange(input.setNo, 1, 50, "setNo");

      return [frameSingleCommand(`ipf set ${String(input.setNo)} -v`)];
    }
    case "filterSetComment": {
      assertIntegerInRange(input.setNo, 1, 50, "setNo");
      assertCliValue(input.comment, "comment");

      return [frameSingleCommand(`ipf set ${String(input.setNo)} -m ${input.comment}`)];
    }
    case "filterSetNext": {
      assertIntegerInRange(input.setNo, 1, 50, "setNo");
      assertIntegerInRange(input.nextSetNo, 0, 50, "nextSetNo");

      return [frameSingleCommand(`ipf set ${String(input.setNo)} -n ${String(input.nextSetNo)}`)];
    }
  }
}

export const ipfSet: TypedOperation<IpfSetInput, RawCommandOutput> = {
  manifestId: "cli.ipf.set",
  classification: "write",
  buildFrames: buildSetFrames,
  parse: (exchanges) => parseSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ipf.rule -- `ipf rule s r [-<command> <parameter> | ...]` (rawLine
// 3600): `-v`, `-e`, `-D`, and any combination of the documented rule
// options via `configure` (see `IpfRuleOption`).
// ---------------------------------------------------------------------------

/** Documented `ipf rule` option letters (rawLine 3600 parameter table). */
const IPF_RULE_FLAGS = [
  "e",
  "v",
  "D",
  "I",
  "O",
  "s",
  "d",
  "S",
  "f",
  "F",
  "m",
  "Y",
  "y",
  "L",
  "q",
  "A",
  "l",
  "a",
  "u",
  "w",
  "n",
  "N",
  "c",
  "C",
  "b",
  "t",
  "M",
  "U",
] as const;

/** Options whose arguments the manual passes as one double-quoted string. */
const IPF_RULE_QUOTED_FLAGS: ReadonlySet<string> = new Set([
  "I",
  "O",
  "s",
  "d",
  "S",
  "F",
  "m",
  "A",
  "a",
  "w",
  "n",
  "C",
  "t",
  "U",
]);

export interface IpfRuleOption {
  /**
   * e enable, D direction, I/O in/out interface (`e LAN1`), s/d source/
   * destination (`o 1 2`, `u 0 <ip> <mask>`), S service (`o 1`, `u 6 ...`),
   * f fragment, F filter action, m MAC bind/syslog, Y/y user management,
   * L session limit, q QoS class, A packet capture, l load balance, a/u/w/n
   * APPE/UCF/WCF/DNS filter profile, N next set, c code page, C window size,
   * b banner, t schedule (`i ...` / `c ...`), M comment, U move (`up`/`down`).
   */
  readonly flag: (typeof IPF_RULE_FLAGS)[number];
  /** Arguments in documented order; none for argument-less options. */
  readonly values?: readonly (string | number)[];
}

function renderIpfRuleOptions(options: readonly IpfRuleOption[]): string {
  if (options.length === 0) {
    throw new InvalidInputError("options must contain at least one rule option.");
  }

  return options
    .map(({ flag, values = [] }) => {
      assertOneOf(flag, IPF_RULE_FLAGS, "flag");
      const tokens = values.map((value, position) => {
        const text = String(value);
        assertCliValue(text, `-${flag} value #${String(position + 1)}`);

        if (text.includes('"')) {
          throw new InvalidInputError(`-${flag} values must not contain double quotes.`);
        }

        return text;
      });

      if (tokens.length === 0) {
        return `-${flag}`;
      }

      const joined = tokens.join(" ");

      return `-${flag} ${IPF_RULE_QUOTED_FLAGS.has(flag) ? `"${joined}"` : joined}`;
    })
    .join(" ");
}

export type IpfRuleInput =
  | { readonly setNo: number; readonly ruleNo: number; readonly action: "view" }
  | {
      readonly setNo: number;
      readonly ruleNo: number;
      readonly action: "enable";
      readonly enabled: boolean;
    }
  | {
      readonly setNo: number;
      readonly ruleNo: number;
      readonly action: "direction";
      readonly direction: 0 | 1 | 2 | 3;
    }
  | {
      readonly setNo: number;
      readonly ruleNo: number;
      readonly action: "configure";
      readonly options: readonly IpfRuleOption[];
    };

function buildRuleFrames(input: IpfRuleInput): readonly CommandFrame[] {
  assertIntegerInRange(input.setNo, 1, 50, "setNo");
  assertIntegerInRange(input.ruleNo, 1, 30, "ruleNo");

  const prefix = `ipf rule ${String(input.setNo)} ${String(input.ruleNo)}`;

  switch (input.action) {
    case "view": {
      return [frameSingleCommand(`${prefix} -v`)];
    }
    case "enable": {
      return [frameSingleCommand(`${prefix} -e ${input.enabled ? "1" : "0"}`)];
    }
    case "direction": {
      assertOneOf(input.direction, [0, 1, 2, 3], "direction");

      return [frameSingleCommand(`${prefix} -D ${String(input.direction)}`)];
    }
    case "configure": {
      return [frameSingleCommand(`${prefix} ${renderIpfRuleOptions(input.options)}`)];
    }
  }
}

export const ipfRule: TypedOperation<IpfRuleInput, RawCommandOutput> = {
  manifestId: "cli.ipf.rule",
  classification: "write",
  buildFrames: buildRuleFrames,
  parse: (exchanges) => parseRule(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ipf.flowtrack.view -- `ipf flowtrack view <-f/-b>` (rawLine 3964) -- read.
// ---------------------------------------------------------------------------

export interface IpfFlowtrackViewInput {
  readonly mode: "sessions" | "all";
}

function buildFlowtrackViewFrames(input: IpfFlowtrackViewInput): readonly CommandFrame[] {
  assertOneOf(input.mode, ["sessions", "all"], "mode");

  const flag = input.mode === "sessions" ? "-f" : "-b";

  return [frameSingleCommand(`ipf flowtrack view ${flag}`)];
}

export const ipfFlowtrackView: TypedOperation<IpfFlowtrackViewInput, RawCommandOutput> = {
  manifestId: "cli.ipf.flowtrack.view",
  classification: "read",
  buildFrames: buildFlowtrackViewFrames,
  parse: (exchanges) => parseFlowtrackView(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ipf.flowtrack.set -- `ipf flowtrack set <-r/-e>` (rawLine 3964) -- write.
// ---------------------------------------------------------------------------

export interface IpfFlowtrackSetInput {
  readonly action: "refresh" | "enable";
}

function buildFlowtrackSetFrames(input: IpfFlowtrackSetInput): readonly CommandFrame[] {
  assertOneOf(input.action, ["refresh", "enable"], "action");

  const flag = input.action === "refresh" ? "-r" : "-e";

  return [frameSingleCommand(`ipf flowtrack set ${flag}`)];
}

export const ipfFlowtrackSet: TypedOperation<IpfFlowtrackSetInput, RawCommandOutput> = {
  manifestId: "cli.ipf.flowtrack.set",
  classification: "write",
  buildFrames: buildFlowtrackSetFrames,
  parse: (exchanges) => parseFlowtrackSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ipf.set.rule -- `ipf set <SET_NO> rule <RULE_NO> <Options>` (rawLine
// 3125): the same rule options as `ipf rule`, addressed through `ipf set`.
// ---------------------------------------------------------------------------

export interface IpfSetRuleInput {
  readonly setNo: number;
  readonly ruleNo: number;
  readonly options: readonly IpfRuleOption[];
}

export const ipfSetRule = defineRawOperation<IpfSetRuleInput>(
  "cli.ipf.set.rule",
  "write",
  (input) => {
    assertIntegerInRange(input.setNo, 1, 50, "setNo");
    assertIntegerInRange(input.ruleNo, 1, 30, "ruleNo");
    return `ipf set ${String(input.setNo)} rule ${String(input.ruleNo)} ${renderIpfRuleOptions(input.options)}`;
  },
);

// ---------------------------------------------------------------------------
// Live-firmware-recon operations (fw 4.4.7_RC2 `?` help, owner capture in
// `references/live-help-fw-4.4.7_RC2.txt`); absent from the Part VIII PDF.
// ---------------------------------------------------------------------------

/** Resets every filter rule to its default. */
export const ipfDefault = defineCommandOperation("cli.ipf.default", "destructive", "ipf default");

export type IpfHashAnalysisInput =
  | { readonly view: "summary" | "total" }
  | { readonly view: "threshold"; readonly hashCounts: number }
  | {
      /** Hash index range 0..8191. */
      readonly view: "interval" | "detail";
      readonly begin: number;
      readonly end: number;
    };

export const ipfHashAnalysis = defineRawOperation<IpfHashAnalysisInput>(
  "cli.ipf.hashanalysis",
  "read",
  (input) => {
    switch (input.view) {
      case "threshold":
        assertIntegerInRange(input.hashCounts, 1, 1_000_000, "hashCounts");
        return `ipf hash_analysis threshold ${String(input.hashCounts)}`;
      case "interval":
      case "detail":
        assertIntegerInRange(input.begin, 0, 8191, "begin");
        assertIntegerInRange(input.end, input.begin, 8191, "end");
        return `ipf hash_analysis ${input.view} ${String(input.begin)} ${String(input.end)}`;
      default:
        assertOneOf(input.view, ["summary", "total"], "view");
        return `ipf hash_analysis ${input.view}`;
    }
  },
);

export const operations: readonly TypedOperation<never, unknown>[] = [
  ipfSetRule,
  ipfView,
  ipfSet,
  ipfRule,
  ipfFlowtrackView,
  ipfFlowtrackSet,
  ipfDefault,
  ipfHashAnalysis,
];
