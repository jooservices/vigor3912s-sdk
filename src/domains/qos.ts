/**
 * `qos` domain -- Wave 4 Item5-qos (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the 2 already-classified `cli.qos.*` manifest entries assigned
 * to this family, including previously deferred `cli.qos.type` and
 * `cli.qos.voip`. `qos type` is YAGNI-narrowed to the documented add example
 * (`-a/-t/-p`); edit/delete/list remain deferred. `qos voip` models on/off.
 *
 * Both documented commands (`qos setup [-<command> <parameter> | ...]`,
 * `qos class -c <no> -<a|e|d <no>>[-<command> <parameter> | ...]`) accept a
 * large number of optional flags (rawLine 6452-6628). Per `wan.ts`/`srv.ts`
 * precedent (model the canonical documented example variants, defer
 * exhaustive flag coverage as YAGNI, note it explicitly rather than
 * silently dropping it), this module models:
 *  - `qos setup`: every flag demonstrated by the documented example
 *    (`> qos setup -m 3 -i 9500 -o 8500 -r 3:20 -u 1 -p 50 -t 1`, rawLine
 *    ~6510) plus the remaining bandwidth/VoIP-adjustment flags from the same
 *    syntax table (`-W`, `-V`, `-I`, `-O`, `-v`). `-h` (usage text) and `-D`
 *    (factory-reset all WANs' QoS settings) are deliberately out of scope
 *    for this task -- `-h` carries no configuration intent to model, and
 *    `-D` is a distinct reset action better suited to its own reviewed
 *    input shape later, not bundled into the general setup flag set.
 *  - `qos class`: the add/edit/delete rule forms demonstrated by the
 *    documented examples (`-c`, `-n`, `-a`/`-e`/`-d`, `-m`, `-l`, rawLine
 *    ~6608). The remaining flags documented for this heading (`-v` IP
 *    version, `-L`/`-M` IP group/object addressing, `-r` remote address,
 *    `-p`/`-s`/`-u`/`-o`/`-g` service-type selectors, `-S`/`-V` show-only
 *    queries) are a deliberate YAGNI deferral, not an oversight.
 *
 * Every `buildFrames` validates its input before calling
 * `frameSingleCommand` -- `frameSingleCommand` itself only rejects framing
 * hazards (control chars, shell metacharacters, empty input), it has no
 * notion of a command's own documented argument shape. Validation failures
 * throw a plain `Error` (this family's write scope excludes `src/errors.ts`,
 * so no new `SdkErrorCode` is introduced here, matching `wan.ts`'s/
 * `srv.ts`'s precedent).
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/qos/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature). Both documented commands only show free-form acknowledgement
 * text (no structured response shape), so both parsers reduce to trimming
 * the raw exchange text (see `internal/parsers/qos/shared.ts`).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseQosClass } from "../internal/parsers/qos/class.js";
import { parseQosSetup } from "../internal/parsers/qos/setup.js";
import { parseQosType } from "../internal/parsers/qos/type.js";
import { parseQosVoip } from "../internal/parsers/qos/voip.js";
import type { RawCommandOutput } from "../internal/parsers/qos/shared.js";

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
 * Generic runtime membership check for narrow numeric-literal-union inputs
 * (same rationale as `wan.ts`'s `assertOneOf`: TypeScript's literal types
 * only describe well-behaved callers, this exists for callers -- including
 * plain-JS callers and tests -- that don't honor them).
 */
function assertNumberOneOf<T extends number>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly number[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => String(entry)).join(", ")} (got ${String(value)}).`,
    );
  }
}

const SINGLE_CLI_TOKEN_PATTERN = /^\S+$/;

function assertSingleToken(value: string, name: string): void {
  if (!SINGLE_CLI_TOKEN_PATTERN.test(value)) {
    throw new Error(
      `${name} must be a single non-empty token with no whitespace (got "${value}").`,
    );
  }
}

const IPV4_PART =
  "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}";
const QOS_CLASS_ADDRESS_PATTERN = new RegExp(`^${IPV4_PART}(:${IPV4_PART})?$`);

function assertQosClassAddress(value: string, name: string): void {
  if (!QOS_CLASS_ADDRESS_PATTERN.test(value)) {
    throw new Error(
      `${name} must be a single IPv4 address or an "ip1:ip2" range/subnet pair (got "${value}").`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.qos.setup -- `qos setup [-<command> <parameter> | ...]` (rawLine 6452)
// ---------------------------------------------------------------------------

export interface QosSetupInput {
  /** `-W <1~12>`: WAN interface to apply the settings to. Default WAN1. */
  readonly wanInterface?: number;
  /** `-m <mode>`: 0 disable, 1 in, 2 out, 3 both. */
  readonly mode?: 0 | 1 | 2 | 3;
  /** `-i <bandwidth>`: inbound bandwidth in kbps, 1-100000 (Ethernet WAN only). */
  readonly inboundBandwidthKbps?: number;
  /** `-o <bandwidth>`: outbound bandwidth in kbps, 1-100000 (Ethernet WAN only). */
  readonly outboundBandwidthKbps?: number;
  /** `-r <index:ratio>`: ratio (%) for the given class index (1-3). */
  readonly classRatio?: { readonly classIndex: number; readonly ratioPercent: number };
  /** `-u <mode>`: 0 disable, 1 enable UDP bandwidth control. */
  readonly udpBandwidthControlEnabled?: boolean;
  /** `-p <ratio>`: UDP bandwidth limit ratio, in %. */
  readonly udpBandwidthLimitRatioPercent?: number;
  /** `-t <mode>`: 0 disable, 1 enable Outbound TCP ACK Prioritize. */
  readonly outboundTcpAckPrioritizeEnabled?: boolean;
  /** `-V`: show all the settings. */
  readonly showAll?: boolean;
  /** `-I <bandwidth>`: minimum non-VoIP inbound bandwidth (Kbps) when VoIP detected. */
  readonly minNonVoipInboundBandwidthKbps?: number;
  /** `-O <bandwidth>`: minimum non-VoIP outbound bandwidth (Kbps) when VoIP detected. */
  readonly minNonVoipOutboundBandwidthKbps?: number;
  /** `-v <0/1>`: 0 auto bandwidth adjustment, 1 adjust to minimum when VoIP detected. */
  readonly voipBandwidthAdjustMode?: 0 | 1;
}

function buildSetupFrames(input: QosSetupInput): readonly CommandFrame[] {
  const parts: string[] = ["qos setup"];

  if (input.wanInterface !== undefined) {
    assertIntegerInRange(input.wanInterface, 1, 12, "wanInterface");
    parts.push(`-W ${String(input.wanInterface)}`);
  }

  if (input.mode !== undefined) {
    assertNumberOneOf(input.mode, [0, 1, 2, 3], "mode");
    parts.push(`-m ${String(input.mode)}`);
  }

  if (input.inboundBandwidthKbps !== undefined) {
    assertIntegerInRange(input.inboundBandwidthKbps, 1, 100_000, "inboundBandwidthKbps");
    parts.push(`-i ${String(input.inboundBandwidthKbps)}`);
  }

  if (input.outboundBandwidthKbps !== undefined) {
    assertIntegerInRange(input.outboundBandwidthKbps, 1, 100_000, "outboundBandwidthKbps");
    parts.push(`-o ${String(input.outboundBandwidthKbps)}`);
  }

  if (input.classRatio !== undefined) {
    assertIntegerInRange(input.classRatio.classIndex, 1, 3, "classRatio.classIndex");
    assertIntegerInRange(input.classRatio.ratioPercent, 0, 100, "classRatio.ratioPercent");
    parts.push(
      `-r ${String(input.classRatio.classIndex)}:${String(input.classRatio.ratioPercent)}`,
    );
  }

  if (input.udpBandwidthControlEnabled !== undefined) {
    parts.push(`-u ${input.udpBandwidthControlEnabled ? "1" : "0"}`);
  }

  if (input.udpBandwidthLimitRatioPercent !== undefined) {
    assertIntegerInRange(
      input.udpBandwidthLimitRatioPercent,
      0,
      100,
      "udpBandwidthLimitRatioPercent",
    );
    parts.push(`-p ${String(input.udpBandwidthLimitRatioPercent)}`);
  }

  if (input.outboundTcpAckPrioritizeEnabled !== undefined) {
    parts.push(`-t ${input.outboundTcpAckPrioritizeEnabled ? "1" : "0"}`);
  }

  if (input.showAll === true) {
    parts.push("-V");
  }

  if (input.minNonVoipInboundBandwidthKbps !== undefined) {
    assertPositiveInteger(input.minNonVoipInboundBandwidthKbps, "minNonVoipInboundBandwidthKbps");
    parts.push(`-I ${String(input.minNonVoipInboundBandwidthKbps)}`);
  }

  if (input.minNonVoipOutboundBandwidthKbps !== undefined) {
    assertPositiveInteger(input.minNonVoipOutboundBandwidthKbps, "minNonVoipOutboundBandwidthKbps");
    parts.push(`-O ${String(input.minNonVoipOutboundBandwidthKbps)}`);
  }

  if (input.voipBandwidthAdjustMode !== undefined) {
    assertNumberOneOf(input.voipBandwidthAdjustMode, [0, 1], "voipBandwidthAdjustMode");
    parts.push(`-v ${String(input.voipBandwidthAdjustMode)}`);
  }

  if (parts.length === 1) {
    throw new Error("At least one qos setup option must be provided.");
  }

  return [frameSingleCommand(parts.join(" "))];
}

export const qosSetup: TypedOperation<QosSetupInput, RawCommandOutput> = {
  manifestId: "cli.qos.setup",
  classification: "write",
  buildFrames: buildSetupFrames,
  parse: (exchanges) => parseQosSetup(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.qos.class -- `qos class -c <no> -<a|e|d <no>>[-<command> <parameter> |
// ...]` (rawLine 6515) -- add/edit/delete-rule variants documented by the
// heading's own examples (`-n`, `-m`, `-l`); remaining flags are a
// deliberate YAGNI deferral (see this file's module doc comment above).
// ---------------------------------------------------------------------------

export type QosClassInput =
  | {
      readonly classIndex: number;
      readonly action: "add";
      readonly name?: string;
      readonly ruleEnabled?: boolean;
      readonly localAddress?: string;
    }
  | {
      readonly classIndex: number;
      readonly action: "edit";
      readonly ruleIndex: number;
      readonly name?: string;
      readonly ruleEnabled?: boolean;
      readonly localAddress?: string;
    }
  | {
      readonly classIndex: number;
      readonly action: "delete";
      readonly ruleIndex: number;
    };

function pushOptionalNameAndAddress(
  parts: string[],
  input: { readonly name?: string; readonly localAddress?: string; readonly ruleEnabled?: boolean },
): void {
  if (input.name !== undefined) {
    assertSingleToken(input.name, "name");
    parts.push(`-n ${input.name}`);
  }
}

function pushOptionalModeAndAddress(
  parts: string[],
  input: { readonly localAddress?: string; readonly ruleEnabled?: boolean },
): void {
  if (input.ruleEnabled !== undefined) {
    parts.push(`-m ${input.ruleEnabled ? "1" : "0"}`);
  }

  if (input.localAddress !== undefined) {
    assertQosClassAddress(input.localAddress, "localAddress");
    parts.push(`-l ${input.localAddress}`);
  }
}

function buildClassFrames(input: QosClassInput): readonly CommandFrame[] {
  assertIntegerInRange(input.classIndex, 1, 3, "classIndex");

  const parts: string[] = [`qos class -c ${String(input.classIndex)}`];

  switch (input.action) {
    case "add": {
      pushOptionalNameAndAddress(parts, input);
      parts.push("-a");
      pushOptionalModeAndAddress(parts, input);
      break;
    }
    case "edit": {
      assertPositiveInteger(input.ruleIndex, "ruleIndex");
      pushOptionalNameAndAddress(parts, input);
      parts.push(`-e ${String(input.ruleIndex)}`);
      pushOptionalModeAndAddress(parts, input);
      break;
    }
    case "delete": {
      assertPositiveInteger(input.ruleIndex, "ruleIndex");
      parts.push(`-d ${String(input.ruleIndex)}`);
      break;
    }
  }

  return [frameSingleCommand(parts.join(" "))];
}

export const qosClass: TypedOperation<QosClassInput, RawCommandOutput> = {
  manifestId: "cli.qos.class",
  classification: "write",
  buildFrames: buildClassFrames,
  parse: (exchanges) => parseQosClass(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.qos.type -- `qos type [-a ...]` (rawLine 6629) -- YAGNI: add example
// only (`-a/-t/-p`). Edit/delete/list deferred.
// ---------------------------------------------------------------------------

export interface QosTypeAddInput {
  readonly action: "add";
  readonly name: string;
  readonly protocolType: number;
  readonly portRange: string;
}

export type QosTypeInput = QosTypeAddInput;

const QOS_PORT_RANGE_PATTERN = /^\d{1,5}:\d{1,5}$/;

function buildTypeFrames(input: QosTypeInput): readonly CommandFrame[] {
  assertSingleToken(input.name, "name");
  assertIntegerInRange(input.protocolType, 1, 254, "protocolType");

  if (!QOS_PORT_RANGE_PATTERN.test(input.portRange)) {
    throw new Error(`portRange must look like "start:end" (got "${input.portRange}").`);
  }

  return [
    frameSingleCommand(
      `qos type -a ${input.name} -t ${String(input.protocolType)} -p ${input.portRange}`,
    ),
  ];
}

export const qosType: TypedOperation<QosTypeInput, RawCommandOutput> = {
  manifestId: "cli.qos.type",
  classification: "write",
  buildFrames: buildTypeFrames,
  parse: (exchanges) => parseQosType(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.qos.voip -- `qos voip <on/off>` (rawLine 6661) -- write.
// ---------------------------------------------------------------------------

export interface QosVoipInput {
  readonly enabled: boolean;
}

function buildVoipFrames(input: QosVoipInput): readonly CommandFrame[] {
  return [frameSingleCommand(`qos voip ${input.enabled ? "on" : "off"}`)];
}

export const qosVoip: TypedOperation<QosVoipInput, RawCommandOutput> = {
  manifestId: "cli.qos.voip",
  classification: "write",
  buildFrames: buildVoipFrames,
  parse: (exchanges) => parseQosVoip(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  qosSetup,
  qosClass,
  qosType,
  qosVoip,
];
