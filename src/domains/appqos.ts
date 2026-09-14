/**
 * `appqos` domain -- Wave 4 family implementation (`BACKLOG.md` "Wave 4"
 * family task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements all 8 already-classified `cli.appqos.*` manifest entries from
 * the Part VIII `SPLIT_FAMILIES` split of the `appqos` heading (rawLine
 * 11958): `view`/`traceable -v`/`untraceable -v` reads and
 * `enable`/`traceable -e|-d`/`untraceable -e|-d` writes. Basis
 * `documented-syntax`; sibling `vigor3912s-mcp` consulted read-only as
 * evidence (partial coverage).
 *
 * Traceable AP indexes are validated against the documented set
 * (50/51/52/53/54/58/60/62/63/64/65/66/68). Untraceable indexes accept the
 * documented 0-123 range (the PDF's overlapping range wording is treated as
 * inclusive of that band rather than inventing a stricter exclusive set).
 * QoS class is 1-4 per the Parameter Description.
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/appqos/*.ts`.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseView } from "../internal/parsers/appqos/view.js";
import { parseEnable } from "../internal/parsers/appqos/enable.js";
import { parseTraceableView } from "../internal/parsers/appqos/traceable-view.js";
import { parseTraceableEnable } from "../internal/parsers/appqos/traceable-enable.js";
import { parseTraceableDisable } from "../internal/parsers/appqos/traceable-disable.js";
import { parseUntraceableView } from "../internal/parsers/appqos/untraceable-view.js";
import { parseUntraceableEnable } from "../internal/parsers/appqos/untraceable-enable.js";
import { parseUntraceableDisable } from "../internal/parsers/appqos/untraceable-disable.js";
import type { RawCommandOutput } from "../internal/parsers/appqos/shared.js";

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

function assertNumberOneOf<T extends number>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly number[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => String(entry)).join(", ")} (got ${String(value)}).`,
    );
  }
}

const TRACEABLE_APP_INDEXES = [50, 51, 52, 53, 54, 58, 60, 62, 63, 64, 65, 66, 68] as const;
const QOS_CLASSES = [1, 2, 3, 4] as const;

// ---------------------------------------------------------------------------
// cli.appqos.view -- `appqos view` (rawLine 11958) -- read
// ---------------------------------------------------------------------------

function buildViewFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("appqos view")];
}

export const appqosView: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.appqos.view",
  classification: "read",
  buildFrames: buildViewFrames,
  parse: (exchanges) => parseView(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.appqos.enable -- `appqos enable <0/1>` (rawLine 11958) -- write
// ---------------------------------------------------------------------------

export interface AppqosEnableInput {
  readonly enabled: boolean;
}

function buildEnableFrames(input: AppqosEnableInput): readonly CommandFrame[] {
  return [frameSingleCommand(`appqos enable ${input.enabled ? "1" : "0"}`)];
}

export const appqosEnable: TypedOperation<AppqosEnableInput, RawCommandOutput> = {
  manifestId: "cli.appqos.enable",
  classification: "write",
  buildFrames: buildEnableFrames,
  parse: (exchanges) => parseEnable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.appqos.traceable.v -- `appqos traceable -v` (rawLine 11958) -- read
// ---------------------------------------------------------------------------

function buildTraceableViewFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("appqos traceable -v")];
}

export const appqosTraceableView: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.appqos.traceable.v",
  classification: "read",
  buildFrames: buildTraceableViewFrames,
  parse: (exchanges) => parseTraceableView(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.appqos.traceable.e -- `appqos traceable -e <AP_INDEX> <CLASS>`
// (rawLine 11958) -- write
// ---------------------------------------------------------------------------

export interface AppqosTraceableEnableInput {
  readonly appIndex: (typeof TRACEABLE_APP_INDEXES)[number];
  readonly qosClass: (typeof QOS_CLASSES)[number];
}

function buildTraceableEnableFrames(input: AppqosTraceableEnableInput): readonly CommandFrame[] {
  assertNumberOneOf(input.appIndex, TRACEABLE_APP_INDEXES, "appIndex");
  assertNumberOneOf(input.qosClass, QOS_CLASSES, "qosClass");
  return [
    frameSingleCommand(`appqos traceable -e ${String(input.appIndex)} ${String(input.qosClass)}`),
  ];
}

export const appqosTraceableEnable: TypedOperation<AppqosTraceableEnableInput, RawCommandOutput> = {
  manifestId: "cli.appqos.traceable.e",
  classification: "write",
  buildFrames: buildTraceableEnableFrames,
  parse: (exchanges) => parseTraceableEnable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.appqos.traceable.d -- `appqos traceable -d <AP_INDEX>` (rawLine 11958)
// -- write
// ---------------------------------------------------------------------------

export interface AppqosTraceableDisableInput {
  readonly appIndex: (typeof TRACEABLE_APP_INDEXES)[number];
}

function buildTraceableDisableFrames(input: AppqosTraceableDisableInput): readonly CommandFrame[] {
  assertNumberOneOf(input.appIndex, TRACEABLE_APP_INDEXES, "appIndex");
  return [frameSingleCommand(`appqos traceable -d ${String(input.appIndex)}`)];
}

export const appqosTraceableDisable: TypedOperation<AppqosTraceableDisableInput, RawCommandOutput> =
  {
    manifestId: "cli.appqos.traceable.d",
    classification: "write",
    buildFrames: buildTraceableDisableFrames,
    parse: (exchanges) => parseTraceableDisable(firstExchangeText(exchanges)),
  };

// ---------------------------------------------------------------------------
// cli.appqos.untraceable.v -- `appqos untraceable -v` (rawLine 11958) -- read
// ---------------------------------------------------------------------------

function buildUntraceableViewFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("appqos untraceable -v")];
}

export const appqosUntraceableView: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.appqos.untraceable.v",
  classification: "read",
  buildFrames: buildUntraceableViewFrames,
  parse: (exchanges) => parseUntraceableView(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.appqos.untraceable.e -- `appqos untraceable -e <AP_INDEX> <CLASS>`
// (rawLine 11958) -- write
// ---------------------------------------------------------------------------

export interface AppqosUntraceableEnableInput {
  readonly appIndex: number;
  readonly qosClass: (typeof QOS_CLASSES)[number];
}

function buildUntraceableEnableFrames(
  input: AppqosUntraceableEnableInput,
): readonly CommandFrame[] {
  assertIntegerInRange(input.appIndex, 0, 123, "appIndex");
  assertNumberOneOf(input.qosClass, QOS_CLASSES, "qosClass");
  return [
    frameSingleCommand(`appqos untraceable -e ${String(input.appIndex)} ${String(input.qosClass)}`),
  ];
}

export const appqosUntraceableEnable: TypedOperation<
  AppqosUntraceableEnableInput,
  RawCommandOutput
> = {
  manifestId: "cli.appqos.untraceable.e",
  classification: "write",
  buildFrames: buildUntraceableEnableFrames,
  parse: (exchanges) => parseUntraceableEnable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.appqos.untraceable.d -- `appqos untraceable -d <AP_INDEX>` (rawLine
// 11958) -- write
// ---------------------------------------------------------------------------

export interface AppqosUntraceableDisableInput {
  readonly appIndex: number;
}

function buildUntraceableDisableFrames(
  input: AppqosUntraceableDisableInput,
): readonly CommandFrame[] {
  assertIntegerInRange(input.appIndex, 0, 123, "appIndex");
  return [frameSingleCommand(`appqos untraceable -d ${String(input.appIndex)}`)];
}

export const appqosUntraceableDisable: TypedOperation<
  AppqosUntraceableDisableInput,
  RawCommandOutput
> = {
  manifestId: "cli.appqos.untraceable.d",
  classification: "write",
  buildFrames: buildUntraceableDisableFrames,
  parse: (exchanges) => parseUntraceableDisable(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  appqosView,
  appqosEnable,
  appqosTraceableView,
  appqosTraceableEnable,
  appqosTraceableDisable,
  appqosUntraceableView,
  appqosUntraceableEnable,
  appqosUntraceableDisable,
];
