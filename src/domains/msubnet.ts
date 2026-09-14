/**
 * `msubnet` domain -- Wave 4 Item5-msubnet (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements all 17 already-classified `cli.msubnet.*` manifest entries
 * listed in this task's assignment -- "user directive: fully complete every
 * command, nothing deferred" (`BACKLOG.md`'s Wave 4 status note), so unlike
 * `wan.ts` there is no sibling-entry deferral here.
 *
 * Every documented `msubnet <sub-command>` heading in this family (rawLines
 * 4633-5535 of `cli-reference-raw.txt`) takes a LAN-subnet index as its first
 * argument -- almost always `<2/3/.../100>` (LAN2..LAN100; LAN1 is the
 * router's own primary subnet, outside `msubnet`'s scope), except `talk`
 * and `leasetime`, whose own documented ranges are `<1/../100>` (LAN1..
 * LAN100). `msubnet mtu` is the one heading in the family with a different,
 * string-typed target argument (`LAN1~LAN100`, `IP_Routed_Subnet`, `DMZ`),
 * confirmed by that heading's own `?` usage text.
 *
 * `msubnet status` is this family's one `"read"` entry --
 * `classificationBasis: "sibling-live-verified"` per `ARCHITECTURE.md`'s
 * 2026-09-13 root-audit amendment (corrected from the coarser
 * `command-map-family` `"write"` basis); the syntax itself (index argument,
 * one subnet's status per call) is unchanged and still sourced from this
 * heading's own documented example.
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
 * `internal/parsers/msubnet/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature). Sample text used by this family's tests is entirely synthetic,
 * modelled directly on each heading's own documented example (no
 * `command-map.md` examples exist for this family, per this task's
 * assignment note).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseSwitch } from "../internal/parsers/msubnet/switchOp.js";
import { parseAddr } from "../internal/parsers/msubnet/addr.js";
import { parseNmask } from "../internal/parsers/msubnet/nmask.js";
import {
  parseMsubnetStatus,
  type MsubnetStatusReport,
} from "../internal/parsers/msubnet/status.js";
import { parseDhcps } from "../internal/parsers/msubnet/dhcps.js";
import { parseNat } from "../internal/parsers/msubnet/nat.js";
import { parseGateway } from "../internal/parsers/msubnet/gateway.js";
import { parseIpcnt } from "../internal/parsers/msubnet/ipcnt.js";
import { parseTalk } from "../internal/parsers/msubnet/talk.js";
import { parseStartip } from "../internal/parsers/msubnet/startip.js";
import { parsePppip } from "../internal/parsers/msubnet/pppip.js";
import { parseNodetype } from "../internal/parsers/msubnet/nodetype.js";
import { parsePrimwins } from "../internal/parsers/msubnet/primwins.js";
import { parseSecwins } from "../internal/parsers/msubnet/secwins.js";
import { parseTftp } from "../internal/parsers/msubnet/tftp.js";
import { parseMtu } from "../internal/parsers/msubnet/mtu.js";
import { parseLeasetime } from "../internal/parsers/msubnet/leasetime.js";
import type { RawCommandOutput } from "../internal/parsers/msubnet/shared.js";

/** `msubnet <sub-command> <2/3/.../100>` -- documented across almost every heading in this family (LAN2..LAN100; LAN1 is outside `msubnet`'s scope). */
const LAN_INDEX_MIN = 2;
const LAN_INDEX_MAX = 100;

/** `msubnet talk`/`msubnet leasetime` document `<1/../100>` instead (LAN1..LAN100). */
const TALK_LEASETIME_INDEX_MIN = 1;
const TALK_LEASETIME_INDEX_MAX = 100;

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

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function assertIpv4(value: string, name: string): void {
  if (!IPV4_PATTERN.test(value)) {
    throw new Error(`${name} must be a valid IPv4 address (got "${value}").`);
  }
}

function assertNonEmptyString(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
}

/**
 * Generic runtime membership check for narrow string/number-literal-union
 * inputs (mirrors `wan.ts`'s `assertOneOf`: declared generically so
 * `@typescript-eslint/no-unnecessary-condition` doesn't flag it as
 * statically-impossible against well-behaved callers, while still validating
 * plain-JS/test callers that don't honor the literal type).
 */
function assertOneOf<T>(value: T, allowed: readonly T[], name: string): void {
  if (!allowed.includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => JSON.stringify(entry)).join(", ")} (got ${JSON.stringify(value)}).`,
    );
  }
}

function lanIndex(input: { readonly lanIndex: number }): void {
  assertIntegerInRange(input.lanIndex, LAN_INDEX_MIN, LAN_INDEX_MAX, "lanIndex");
}

function onOffToken(enabled: boolean): "On" | "Off" {
  return enabled ? "On" : "Off";
}

// ---------------------------------------------------------------------------
// cli.msubnet.switch -- `msubnet switch <2/../100> <On/Off>` (rawLine 4633)
// ---------------------------------------------------------------------------

export interface MsubnetSwitchInput {
  readonly lanIndex: number;
  readonly enabled: boolean;
}

function buildSwitchFrames(input: MsubnetSwitchInput): readonly CommandFrame[] {
  lanIndex(input);

  return [
    frameSingleCommand(`msubnet switch ${String(input.lanIndex)} ${onOffToken(input.enabled)}`),
  ];
}

export const msubnetSwitch: TypedOperation<MsubnetSwitchInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.switch",
  classification: "write",
  buildFrames: buildSwitchFrames,
  parse: (exchanges) => parseSwitch(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.addr -- `msubnet addr <2/../100> <IP address>` (rawLine 4676)
// ---------------------------------------------------------------------------

export interface MsubnetAddrInput {
  readonly lanIndex: number;
  readonly ipAddress: string;
}

function buildAddrFrames(input: MsubnetAddrInput): readonly CommandFrame[] {
  lanIndex(input);
  assertIpv4(input.ipAddress, "ipAddress");

  return [frameSingleCommand(`msubnet addr ${String(input.lanIndex)} ${input.ipAddress}`)];
}

export const msubnetAddr: TypedOperation<MsubnetAddrInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.addr",
  classification: "write",
  buildFrames: buildAddrFrames,
  parse: (exchanges) => parseAddr(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.nmask -- `msubnet nmask <2/../100> <IP address>` (rawLine 4718)
// ---------------------------------------------------------------------------

export interface MsubnetNmaskInput {
  readonly lanIndex: number;
  readonly netmask: string;
}

function buildNmaskFrames(input: MsubnetNmaskInput): readonly CommandFrame[] {
  lanIndex(input);
  assertIpv4(input.netmask, "netmask");

  return [frameSingleCommand(`msubnet nmask ${String(input.lanIndex)} ${input.netmask}`)];
}

export const msubnetNmask: TypedOperation<MsubnetNmaskInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.nmask",
  classification: "write",
  buildFrames: buildNmaskFrames,
  parse: (exchanges) => parseNmask(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.status -- `msubnet status <2/../100>` (rawLine 4757) -- read
// ---------------------------------------------------------------------------

export interface MsubnetStatusInput {
  readonly lanIndex: number;
}

function buildStatusFrames(input: MsubnetStatusInput): readonly CommandFrame[] {
  lanIndex(input);

  return [frameSingleCommand(`msubnet status ${String(input.lanIndex)}`)];
}

export const msubnetStatus: TypedOperation<MsubnetStatusInput, MsubnetStatusReport | null> = {
  manifestId: "cli.msubnet.status",
  classification: "read",
  buildFrames: buildStatusFrames,
  parse: (exchanges) => parseMsubnetStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.dhcps -- `msubnet dhcps <2/../100> <On/Off>` (rawLine 4797)
// ---------------------------------------------------------------------------

export interface MsubnetDhcpsInput {
  readonly lanIndex: number;
  readonly enabled: boolean;
}

function buildDhcpsFrames(input: MsubnetDhcpsInput): readonly CommandFrame[] {
  lanIndex(input);

  return [
    frameSingleCommand(`msubnet dhcps ${String(input.lanIndex)} ${onOffToken(input.enabled)}`),
  ];
}

export const msubnetDhcps: TypedOperation<MsubnetDhcpsInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.dhcps",
  classification: "write",
  buildFrames: buildDhcpsFrames,
  parse: (exchanges) => parseDhcps(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.nat -- `msubnet nat <2/../100> <On/Off>` (rawLine 4837) -- On
// means NAT usage, Off means Routing usage for the subnet.
// ---------------------------------------------------------------------------

export interface MsubnetNatInput {
  readonly lanIndex: number;
  readonly natEnabled: boolean;
}

function buildNatFrames(input: MsubnetNatInput): readonly CommandFrame[] {
  lanIndex(input);

  return [
    frameSingleCommand(`msubnet nat ${String(input.lanIndex)} ${onOffToken(input.natEnabled)}`),
  ];
}

export const msubnetNat: TypedOperation<MsubnetNatInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.nat",
  classification: "write",
  buildFrames: buildNatFrames,
  parse: (exchanges) => parseNat(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.gateway -- `msubnet gateway <2/../100> <Gateway IP>` (rawLine 4883)
// ---------------------------------------------------------------------------

export interface MsubnetGatewayInput {
  readonly lanIndex: number;
  readonly gatewayIp: string;
}

function buildGatewayFrames(input: MsubnetGatewayInput): readonly CommandFrame[] {
  lanIndex(input);
  assertIpv4(input.gatewayIp, "gatewayIp");

  return [frameSingleCommand(`msubnet gateway ${String(input.lanIndex)} ${input.gatewayIp}`)];
}

export const msubnetGateway: TypedOperation<MsubnetGatewayInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.gateway",
  classification: "write",
  buildFrames: buildGatewayFrames,
  parse: (exchanges) => parseGateway(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.ipcnt -- `msubnet ipcnt <2/../100> <IP counts>` (rawLine 4925)
// -- documented range "0 to 220".
// ---------------------------------------------------------------------------

export interface MsubnetIpcntInput {
  readonly lanIndex: number;
  readonly ipCount: number;
}

function buildIpcntFrames(input: MsubnetIpcntInput): readonly CommandFrame[] {
  lanIndex(input);
  assertIntegerInRange(input.ipCount, 0, 220, "ipCount");

  return [frameSingleCommand(`msubnet ipcnt ${String(input.lanIndex)} ${String(input.ipCount)}`)];
}

export const msubnetIpcnt: TypedOperation<MsubnetIpcntInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.ipcnt",
  classification: "write",
  buildFrames: buildIpcntFrames,
  parse: (exchanges) => parseIpcnt(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.talk -- `msubnet talk <1/../100> <1/../100> <On/Off>`
// (rawLine 4963) -- establishes/removes routing between two LAN interfaces.
// ---------------------------------------------------------------------------

export interface MsubnetTalkInput {
  readonly firstLanIndex: number;
  readonly secondLanIndex: number;
  readonly enabled: boolean;
}

function buildTalkFrames(input: MsubnetTalkInput): readonly CommandFrame[] {
  assertIntegerInRange(
    input.firstLanIndex,
    TALK_LEASETIME_INDEX_MIN,
    TALK_LEASETIME_INDEX_MAX,
    "firstLanIndex",
  );
  assertIntegerInRange(
    input.secondLanIndex,
    TALK_LEASETIME_INDEX_MIN,
    TALK_LEASETIME_INDEX_MAX,
    "secondLanIndex",
  );

  return [
    frameSingleCommand(
      `msubnet talk ${String(input.firstLanIndex)} ${String(input.secondLanIndex)} ${onOffToken(input.enabled)}`,
    ),
  ];
}

export const msubnetTalk: TypedOperation<MsubnetTalkInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.talk",
  classification: "write",
  buildFrames: buildTalkFrames,
  parse: (exchanges) => parseTalk(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.startip -- `msubnet startip <2/../100> <Start IP>` (rawLine 5024)
// -- the syntax block labels the argument "Gateway IP" but the description
// and worked example both call it the DHCP starting IP address; modelled per
// the description/example, not the mislabeled syntax placeholder.
// ---------------------------------------------------------------------------

export interface MsubnetStartipInput {
  readonly lanIndex: number;
  readonly startIp: string;
}

function buildStartipFrames(input: MsubnetStartipInput): readonly CommandFrame[] {
  lanIndex(input);
  assertIpv4(input.startIp, "startIp");

  return [frameSingleCommand(`msubnet startip ${String(input.lanIndex)} ${input.startIp}`)];
}

export const msubnetStartip: TypedOperation<MsubnetStartipInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.startip",
  classification: "write",
  buildFrames: buildStartipFrames,
  parse: (exchanges) => parseStartip(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.pppip -- `msubnet pppip <2/../100> <Start IP>` (rawLine 5112)
// ---------------------------------------------------------------------------

export interface MsubnetPppipInput {
  readonly lanIndex: number;
  readonly startIp: string;
}

function buildPppipFrames(input: MsubnetPppipInput): readonly CommandFrame[] {
  lanIndex(input);
  assertIpv4(input.startIp, "startIp");

  return [frameSingleCommand(`msubnet pppip ${String(input.lanIndex)} ${input.startIp}`)];
}

export const msubnetPppip: TypedOperation<MsubnetPppipInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.pppip",
  classification: "write",
  buildFrames: buildPppipFrames,
  parse: (exchanges) => parsePppip(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.nodetype -- `msubnet nodetype <2/../100> <count>` (rawLine 5196)
// -- documented `count` values: 1=B-node, 2=P-node, 4=M-node, 8=H-node,
// 0=not specified.
// ---------------------------------------------------------------------------

const NODE_TYPE_VALUES = [0, 1, 2, 4, 8] as const;
export type MsubnetNodeType = (typeof NODE_TYPE_VALUES)[number];

export interface MsubnetNodetypeInput {
  readonly lanIndex: number;
  readonly nodeType: MsubnetNodeType;
}

function buildNodetypeFrames(input: MsubnetNodetypeInput): readonly CommandFrame[] {
  lanIndex(input);
  assertOneOf(input.nodeType, NODE_TYPE_VALUES, "nodeType");

  return [
    frameSingleCommand(`msubnet nodetype ${String(input.lanIndex)} ${String(input.nodeType)}`),
  ];
}

export const msubnetNodetype: TypedOperation<MsubnetNodetypeInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.nodetype",
  classification: "write",
  buildFrames: buildNodetypeFrames,
  parse: (exchanges) => parseNodetype(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.primwins -- `msubnet primWINS <2/../100> <WINS IP>` (rawLine 5265)
// ---------------------------------------------------------------------------

export interface MsubnetPrimwinsInput {
  readonly lanIndex: number;
  readonly winsIp: string;
}

function buildPrimwinsFrames(input: MsubnetPrimwinsInput): readonly CommandFrame[] {
  lanIndex(input);
  assertIpv4(input.winsIp, "winsIp");

  return [frameSingleCommand(`msubnet primWINS ${String(input.lanIndex)} ${input.winsIp}`)];
}

export const msubnetPrimwins: TypedOperation<MsubnetPrimwinsInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.primwins",
  classification: "write",
  buildFrames: buildPrimwinsFrames,
  parse: (exchanges) => parsePrimwins(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.secwins -- `msubnet secWINS <2/../100> <WINS IP>` (rawLine 5367)
// ---------------------------------------------------------------------------

export interface MsubnetSecwinsInput {
  readonly lanIndex: number;
  readonly winsIp: string;
}

function buildSecwinsFrames(input: MsubnetSecwinsInput): readonly CommandFrame[] {
  lanIndex(input);
  assertIpv4(input.winsIp, "winsIp");

  return [frameSingleCommand(`msubnet secWINS ${String(input.lanIndex)} ${input.winsIp}`)];
}

export const msubnetSecwins: TypedOperation<MsubnetSecwinsInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.secwins",
  classification: "write",
  buildFrames: buildSecwinsFrames,
  parse: (exchanges) => parseSecwins(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.tftp -- `msubnet tftp <2/../100> <TFTP servername>` (rawLine 5439)
// ---------------------------------------------------------------------------

export interface MsubnetTftpInput {
  readonly lanIndex: number;
  readonly serverName: string;
}

function buildTftpFrames(input: MsubnetTftpInput): readonly CommandFrame[] {
  lanIndex(input);
  assertNonEmptyString(input.serverName, "serverName");

  return [frameSingleCommand(`msubnet tftp ${String(input.lanIndex)} ${input.serverName}`)];
}

export const msubnetTftp: TypedOperation<MsubnetTftpInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.tftp",
  classification: "write",
  buildFrames: buildTftpFrames,
  parse: (exchanges) => parseTftp(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.mtu -- `msubnet mtu <interface> <value>` (rawLine 5496) --
// this heading's own `?` usage text documents `<interface>` as
// `LAN1~LAN100,IP_Routed_Subnet,DMZ` (not an index like the rest of this
// family) and `<value>` as `1000 ~ 1508` bytes.
// ---------------------------------------------------------------------------

const MTU_INTERFACE_PATTERN = /^(LAN([1-9]|[1-9]\d|100)|IP_Routed_Subnet|DMZ)$/;

export interface MsubnetMtuInput {
  readonly interfaceName: string;
  readonly mtuValue: number;
}

function buildMtuFrames(input: MsubnetMtuInput): readonly CommandFrame[] {
  if (!MTU_INTERFACE_PATTERN.test(input.interfaceName)) {
    throw new Error(
      `interfaceName must be "LAN1".."LAN100", "IP_Routed_Subnet", or "DMZ" (got "${input.interfaceName}").`,
    );
  }
  assertIntegerInRange(input.mtuValue, 1000, 1508, "mtuValue");

  return [frameSingleCommand(`msubnet mtu ${input.interfaceName} ${String(input.mtuValue)}`)];
}

export const msubnetMtu: TypedOperation<MsubnetMtuInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.mtu",
  classification: "write",
  buildFrames: buildMtuFrames,
  parse: (exchanges) => parseMtu(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.msubnet.leasetime -- `msubnet leasetime <1/../100> [<Lease Time (sec.)>]`
// (rawLine 5535) -- documented range "1 to 259200"; the heading's own worked
// example (`> msubnet leasetime 1`) shows the lease-time argument may be
// omitted, in which case the router keeps/uses its existing value.
// ---------------------------------------------------------------------------

export interface MsubnetLeasetimeInput {
  readonly lanIndex: number;
  readonly leaseTimeSec?: number;
}

function buildLeasetimeFrames(input: MsubnetLeasetimeInput): readonly CommandFrame[] {
  assertIntegerInRange(
    input.lanIndex,
    TALK_LEASETIME_INDEX_MIN,
    TALK_LEASETIME_INDEX_MAX,
    "lanIndex",
  );

  if (input.leaseTimeSec === undefined) {
    return [frameSingleCommand(`msubnet leasetime ${String(input.lanIndex)}`)];
  }

  assertIntegerInRange(input.leaseTimeSec, 1, 259_200, "leaseTimeSec");

  return [
    frameSingleCommand(`msubnet leasetime ${String(input.lanIndex)} ${String(input.leaseTimeSec)}`),
  ];
}

export const msubnetLeasetime: TypedOperation<MsubnetLeasetimeInput, RawCommandOutput> = {
  manifestId: "cli.msubnet.leasetime",
  classification: "write",
  buildFrames: buildLeasetimeFrames,
  parse: (exchanges) => parseLeasetime(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  msubnetSwitch,
  msubnetAddr,
  msubnetNmask,
  msubnetStatus,
  msubnetDhcps,
  msubnetNat,
  msubnetGateway,
  msubnetIpcnt,
  msubnetTalk,
  msubnetStartip,
  msubnetPppip,
  msubnetNodetype,
  msubnetPrimwins,
  msubnetSecwins,
  msubnetTftp,
  msubnetMtu,
  msubnetLeasetime,
];
