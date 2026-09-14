/**
 * `vlan` domain -- Wave 4 Item5-vlan (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements classified `cli.vlan.*` entries including previously deferred
 * `pri`, `restart`, and `submode` on/off/status.
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
 * `internal/parsers/vlan/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseGroup } from "../internal/parsers/vlan/group.js";
import { parseOff } from "../internal/parsers/vlan/off.js";
import { parseOn } from "../internal/parsers/vlan/on.js";
import { parseSubnet } from "../internal/parsers/vlan/subnet.js";
import { parseTagged } from "../internal/parsers/vlan/tagged.js";
import { parseVid } from "../internal/parsers/vlan/vid.js";
import { parseSysvid } from "../internal/parsers/vlan/sysvid.js";
import { parseVlanStatus, type VlanStatusReport } from "../internal/parsers/vlan/status.js";
import { parsePri } from "../internal/parsers/vlan/pri.js";
import { parseRestart } from "../internal/parsers/vlan/restart.js";
import { parseSubmodeStatus } from "../internal/parsers/vlan/submode-status.js";
import { parseSubmodeOn } from "../internal/parsers/vlan/submode-on.js";
import { parseSubmodeOff } from "../internal/parsers/vlan/submode-off.js";
import type { RawCommandOutput } from "../internal/parsers/vlan/shared.js";

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
 * Generic runtime membership check for narrow string-literal-union inputs.
 * Declared generically (rather than as direct `!==` comparisons against the
 * union's own members) so `@typescript-eslint/no-unnecessary-condition`
 * doesn't flag it as statically-impossible: TypeScript's own literal types
 * only describe well-behaved callers, but this validation exists precisely
 * for callers (including plain-JS callers and tests) that don't honor them.
 */
function assertOneOf<T extends string>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => `"${entry}"`).join(", ")} (got "${value}").`,
    );
  }
}

// LAN port numbers documented across this router's `vlan *` commands (p1..p12).
const LAN_PORT_MIN = 1;
const LAN_PORT_MAX = 12;

// ---------------------------------------------------------------------------
// cli.vlan.group -- `vlan group <id> <add/add_ex/set/set_ex/show> <ports...>`
// (rawLine 9336)
// ---------------------------------------------------------------------------

export type VlanGroupAction = "add" | "add_ex" | "set" | "set_ex" | "show";

export interface VlanGroupInput {
  readonly groupId: number;
  readonly action: VlanGroupAction;
  /** LAN port numbers (1-12) to join the group; required for every action except `"show"` (documented example: `vlan group 3 set p1 p4`). */
  readonly ports?: readonly number[];
}

function buildGroupFrames(input: VlanGroupInput): readonly CommandFrame[] {
  assertIntegerInRange(input.groupId, 0, 99, "groupId");
  assertOneOf(input.action, ["add", "add_ex", "set", "set_ex", "show"], "action");

  const ports = input.ports ?? [];

  if (input.action !== "show" && ports.length === 0) {
    throw new Error(`ports must include at least one LAN port for action "${input.action}".`);
  }

  for (const port of ports) {
    assertIntegerInRange(port, LAN_PORT_MIN, LAN_PORT_MAX, "each port in ports");
  }

  const portsSuffix =
    ports.length > 0 ? ` ${ports.map((port) => `p${String(port)}`).join(" ")}` : "";

  return [frameSingleCommand(`vlan group ${String(input.groupId)} ${input.action}${portsSuffix}`)];
}

export const vlanGroup: TypedOperation<VlanGroupInput, RawCommandOutput> = {
  manifestId: "cli.vlan.group",
  classification: "write",
  buildFrames: buildGroupFrames,
  parse: (exchanges) => parseGroup(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vlan.off -- `vlan off` (rawLine 9384)
// ---------------------------------------------------------------------------

function buildOffFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vlan off")];
}

export const vlanOff: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vlan.off",
  classification: "write",
  buildFrames: buildOffFrames,
  parse: (exchanges) => parseOff(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vlan.on -- `vlan on` (rawLine 9396)
// ---------------------------------------------------------------------------

function buildOnFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vlan on")];
}

export const vlanOn: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vlan.on",
  classification: "write",
  buildFrames: buildOnFrames,
  parse: (exchanges) => parseOn(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vlan.status -- `vlan status` (rawLine 9426) -- read
// ---------------------------------------------------------------------------

function buildStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vlan status")];
}

export const vlanStatus: TypedOperation<void, VlanStatusReport> = {
  manifestId: "cli.vlan.status",
  classification: "read",
  buildFrames: buildStatusFrames,
  parse: (exchanges) => parseVlanStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vlan.subnet -- `vlan subnet group_id <n>` (rawLine 9462); `n` is the
// LAN interface number, 1-100 (the doc's "group_id" here is a literal
// keyword, not the VLAN group id -- see the documented example `vlan subnet
// group_id 2`).
// ---------------------------------------------------------------------------

export interface VlanSubnetInput {
  readonly lanInterface: number;
}

function buildSubnetFrames(input: VlanSubnetInput): readonly CommandFrame[] {
  assertIntegerInRange(input.lanInterface, 1, 100, "lanInterface");

  return [frameSingleCommand(`vlan subnet group_id ${String(input.lanInterface)}`)];
}

export const vlanSubnet: TypedOperation<VlanSubnetInput, RawCommandOutput> = {
  manifestId: "cli.vlan.subnet",
  classification: "write",
  buildFrames: buildSubnetFrames,
  parse: (exchanges) => parseSubnet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vlan.tagged -- `vlan tagged <n> <on/off>` / `vlan tagged unlimited
// <on/off>` / `vlan tagged p1_untag <on/off>` (rawLine 9510)
// ---------------------------------------------------------------------------

export type VlanTaggedInput =
  | { readonly target: "channel"; readonly channel: number; readonly state: "on" | "off" }
  | { readonly target: "unlimited"; readonly state: "on" | "off" }
  | { readonly target: "p1_untag"; readonly state: "on" | "off" };

function buildTaggedFrames(input: VlanTaggedInput): readonly CommandFrame[] {
  assertOneOf(input.state, ["on", "off"], "state");

  switch (input.target) {
    case "channel": {
      assertIntegerInRange(input.channel, 0, 99, "channel");

      return [frameSingleCommand(`vlan tagged ${String(input.channel)} ${input.state}`)];
    }
    case "unlimited": {
      return [frameSingleCommand(`vlan tagged unlimited ${input.state}`)];
    }
    case "p1_untag": {
      return [frameSingleCommand(`vlan tagged p1_untag ${input.state}`)];
    }
  }
}

export const vlanTagged: TypedOperation<VlanTaggedInput, RawCommandOutput> = {
  manifestId: "cli.vlan.tagged",
  classification: "write",
  buildFrames: buildTaggedFrames,
  parse: (exchanges) => parseTagged(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vlan.vid -- `vlan vid n vid_no` (rawLine 9537)
// ---------------------------------------------------------------------------

export interface VlanVidInput {
  readonly channel: number;
  readonly vid: number;
}

function buildVidFrames(input: VlanVidInput): readonly CommandFrame[] {
  assertIntegerInRange(input.channel, 0, 7, "channel");
  assertIntegerInRange(input.vid, 0, 4095, "vid");

  return [frameSingleCommand(`vlan vid ${String(input.channel)} ${String(input.vid)}`)];
}

export const vlanVid: TypedOperation<VlanVidInput, RawCommandOutput> = {
  manifestId: "cli.vlan.vid",
  classification: "write",
  buildFrames: buildVidFrames,
  parse: (exchanges) => parseVid(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vlan.sysvid -- `vlan sysvid <show | n>` (rawLine 9551)
// ---------------------------------------------------------------------------

export type VlanSysvidInput =
  { readonly mode: "show" } | { readonly mode: "set"; readonly value: number };

function buildSysvidFrames(input: VlanSysvidInput): readonly CommandFrame[] {
  switch (input.mode) {
    case "show": {
      return [frameSingleCommand("vlan sysvid show")];
    }
    case "set": {
      assertIntegerInRange(input.value, 0, 3828, "value");

      return [frameSingleCommand(`vlan sysvid ${String(input.value)}`)];
    }
  }
}

export const vlanSysvid: TypedOperation<VlanSysvidInput, RawCommandOutput> = {
  manifestId: "cli.vlan.sysvid",
  classification: "write",
  buildFrames: buildSysvidFrames,
  parse: (exchanges) => parseSysvid(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vlan.pri -- `vlan pri n pri_no` (rawLine 9404) -- write.
// ---------------------------------------------------------------------------

export interface VlanPriInput {
  readonly vlanId: number;
  readonly priority: number;
}

function buildPriFrames(input: VlanPriInput): readonly CommandFrame[] {
  assertIntegerInRange(input.vlanId, 0, 7, "vlanId");
  assertIntegerInRange(input.priority, 0, 7, "priority");

  return [frameSingleCommand(`vlan pri ${String(input.vlanId)} ${String(input.priority)}`)];
}

export const vlanPri: TypedOperation<VlanPriInput, RawCommandOutput> = {
  manifestId: "cli.vlan.pri",
  classification: "write",
  buildFrames: buildPriFrames,
  parse: (exchanges) => parsePri(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vlan.restart -- `vlan restart` (rawLine 9418) -- write.
// ---------------------------------------------------------------------------

function buildRestartFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vlan restart")];
}

export const vlanRestart: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vlan.restart",
  classification: "write",
  buildFrames: buildRestartFrames,
  parse: (exchanges) => parseRestart(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vlan.submode.status/on/off -- `vlan submode <on|off|status>` (rawLine
// 9496).
// ---------------------------------------------------------------------------

function buildSubmodeStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vlan submode status")];
}

export const vlanSubmodeStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vlan.submode.status",
  classification: "read",
  buildFrames: buildSubmodeStatusFrames,
  parse: (exchanges) => parseSubmodeStatus(firstExchangeText(exchanges)),
};

function buildSubmodeOnFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vlan submode on")];
}

export const vlanSubmodeOn: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vlan.submode.on",
  classification: "write",
  buildFrames: buildSubmodeOnFrames,
  parse: (exchanges) => parseSubmodeOn(firstExchangeText(exchanges)),
};

function buildSubmodeOffFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vlan submode off")];
}

export const vlanSubmodeOff: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vlan.submode.off",
  classification: "write",
  buildFrames: buildSubmodeOffFrames,
  parse: (exchanges) => parseSubmodeOff(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  vlanGroup,
  vlanOff,
  vlanOn,
  vlanStatus,
  vlanSubnet,
  vlanTagged,
  vlanVid,
  vlanSysvid,
  vlanPri,
  vlanRestart,
  vlanSubmodeStatus,
  vlanSubmodeOn,
  vlanSubmodeOff,
];
