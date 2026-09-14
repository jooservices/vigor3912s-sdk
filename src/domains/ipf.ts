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

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseView, type IpfViewReport } from "../internal/parsers/ipf/view.js";
import { parseSet } from "../internal/parsers/ipf/set.js";
import { parseRule } from "../internal/parsers/ipf/rule.js";
import { parseFlowtrackView } from "../internal/parsers/ipf/flowtrack-view.js";
import { parseFlowtrackSet } from "../internal/parsers/ipf/flowtrack-set.js";
import type { RawCommandOutput } from "../internal/parsers/ipf/shared.js";

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
 * Generic runtime membership check for narrow string- or number-literal-
 * union inputs (same rationale as `domains/wan.ts`'s `assertOneOf`:
 * TypeScript's literal types only describe well-behaved callers, this
 * exists for callers, including plain-JS callers and tests, that don't
 * honor them).
 */
function assertOneOf<T extends string | number>(
  value: T,
  allowed: readonly T[],
  name: string,
): void {
  if (!allowed.includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => JSON.stringify(entry)).join(", ")} (got ${JSON.stringify(value)}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.ipf.view -- `ipf view [-VcdhrtzZ]` (rawLine 3103) -- read
// ---------------------------------------------------------------------------

const IPF_VIEW_FLAGS = ["V", "c", "d", "h", "r", "t", "z", "Z"] as const;
export type IpfViewFlag = (typeof IPF_VIEW_FLAGS)[number];

export interface IpfViewInput {
  readonly flags?: readonly IpfViewFlag[];
}

function buildViewFrames(input: IpfViewInput | undefined): readonly CommandFrame[] {
  const flags = input?.flags ?? [];
  const seen = new Set<IpfViewFlag>();

  for (const flag of flags) {
    assertOneOf(flag, IPF_VIEW_FLAGS, "each flag in flags");

    if (seen.has(flag)) {
      throw new Error(`flags must not contain duplicates (got repeated "${flag}").`);
    }

    seen.add(flag);
  }

  const suffix = flags.length > 0 ? ` ${flags.map((flag) => `-${flag}`).join(" ")}` : "";

  return [frameSingleCommand(`ipf view${suffix}`)];
}

export const ipfView: TypedOperation<IpfViewInput | undefined, IpfViewReport> = {
  manifestId: "cli.ipf.view",
  classification: "read",
  buildFrames: buildViewFrames,
  parse: (exchanges) => parseView(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ipf.set -- `ipf set <Options>` (rawLine 3125) -- canonical general
// options only (`-c`, `-d`, `-p`, `-R`, `-L`, `-C`); see file header.
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
  | { readonly action: "codePage"; readonly page: number };

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
// 3600) -- canonical `-v` / `-e` / `-D` sub-forms only; see file header.
// ---------------------------------------------------------------------------

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

export const operations: readonly TypedOperation<never, unknown>[] = [
  ipfView,
  ipfSet,
  ipfRule,
  ipfFlowtrackView,
  ipfFlowtrackSet,
];
