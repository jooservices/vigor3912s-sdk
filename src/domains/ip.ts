/**
 * `ip` domain -- Wave 4 Item5-ip (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements every implementable `cli.ip.*` entry. `cli.ip.telnet` is
 * `status: "blocked-by-documentation"` (nested interactive telnet session;
 * does not fit the bounded single-exchange model) — not implemented.
 *
 * Every `buildFrames` validates its input before calling
 * `frameSingleCommand` -- `frameSingleCommand` itself only rejects framing
 * hazards (control chars, shell metacharacters, empty input), it has no
 * notion of a command's own documented argument shape. Validation failures
 * throw a plain `Error` (this family's write scope excludes `src/errors.ts`,
 * so no new `SdkErrorCode` is introduced here) -- same convention as the
 * accepted `wan` family (`src/domains/wan.ts`).
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/ip/*.ts`. Multi-variant documented syntaxes under one
 * heading (e.g. `ip lanalias`, `ip arp`, `ip dhcpc`, `ip route`,
 * `ip session`, `ip bandwidth`, `ip bindmac`, `ip bgp` writes,
 * `ip ospf cfg set`) are modelled as a discriminated `action` union input,
 * one canonical frame per variant -- still exactly one `TypedOperation` per
 * manifest entry. Freely-combinable flag soups (`ip policy_rt`) follow the
 * `ha set` / `mngt snmp` flat-`args` allowlist precedent. Where a heading
 * documents more sub-forms than are implemented here, the narrower
 * per-operation comment says so explicitly (deliberate YAGNI, not an
 * oversight).
 *
 * `ip ping` / `ip tracert` are active network probes that can legitimately
 * run far longer than the 15s default (`ARCHITECTURE.md` Item 3's
 * "diagnostic exception"). Both set
 * `executionOverride: { commandTimeoutMs: 60_000 }` on their
 * `TypedOperation` descriptor -- a registry-defined ceiling, never a
 * caller-supplied `ExecuteOptions.timeoutMs` (that raw-wrapper path can
 * only ever lower the 15s default, per `internal/execution/limits.ts`'s
 * `resolveLimits`).
 */

import { InvalidInputError } from "../errors.js";
import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseAddr } from "../internal/parsers/ip/addr.js";
import { parseArp } from "../internal/parsers/ip/arp.js";
import { parseBandwidth } from "../internal/parsers/ip/bandwidth.js";
import { parseBgp } from "../internal/parsers/ip/bgp.js";
import { parseBgpNeighborShow } from "../internal/parsers/ip/bgp-neighbor-show.js";
import { parseBgpShow } from "../internal/parsers/ip/bgp-show.js";
import { parseBgpStaticShow } from "../internal/parsers/ip/bgp-static-show.js";
import { parseBindmac } from "../internal/parsers/ip/bindmac.js";
import { parseDataflowmonitorOff } from "../internal/parsers/ip/dataflowmonitor-off.js";
import { parseDataflowmonitorOn } from "../internal/parsers/ip/dataflowmonitor-on.js";
import { parseDataflowmonitorStatus } from "../internal/parsers/ip/dataflowmonitor-status.js";
import { parseDhcpc } from "../internal/parsers/ip/dhcpc.js";
import { parseDnsForward } from "../internal/parsers/ip/dnsforward.js";
import { parseIgmpProxyPpp } from "../internal/parsers/ip/igmpproxy-ppp.js";
import { parseIgmpProxyQuery } from "../internal/parsers/ip/igmpproxy-query.js";
import { parseIgmpProxyReset } from "../internal/parsers/ip/igmpproxy-reset.js";
import { parseIgmpProxySet } from "../internal/parsers/ip/igmpproxy-set.js";
import { parseIgmpProxyStatus } from "../internal/parsers/ip/igmpproxy-status.js";
import { parseIgmpProxySyslog } from "../internal/parsers/ip/igmpproxy-syslog.js";
import { parseIgmpProxyVersion } from "../internal/parsers/ip/igmpproxy-version.js";
import { parseIgmpProxyWan } from "../internal/parsers/ip/igmpproxy-wan.js";
import { parseIgmpSnoopAcceptlist } from "../internal/parsers/ip/igmpsnoop-acceptlist.js";
import { parseIgmpSnoopChkleave } from "../internal/parsers/ip/igmpsnoop-chkleave.js";
import { parseIgmpSnoopDisable } from "../internal/parsers/ip/igmpsnoop-disable.js";
import { parseIgmpSnoopEnable } from "../internal/parsers/ip/igmpsnoop-enable.js";
import { parseIgmpSnoopMode } from "../internal/parsers/ip/igmpsnoop-mode.js";
import { parseIgmpSnoopPortchk } from "../internal/parsers/ip/igmpsnoop-portchk.js";
import { parseIgmpSnoopSeparate } from "../internal/parsers/ip/igmpsnoop-separate.js";
import { parseIgmpSnoopStatus } from "../internal/parsers/ip/igmpsnoop-status.js";
import { parseIgmpSnoopTable } from "../internal/parsers/ip/igmpsnoop-table.js";
import { parseIgmpSnoopTxquery } from "../internal/parsers/ip/igmpsnoop-txquery.js";
import { parseLanAlias } from "../internal/parsers/ip/lanalias.js";
import { parseLanDnsRes } from "../internal/parsers/ip/landnsres.js";
import { parseMaxnatuser } from "../internal/parsers/ip/maxnatuser.js";
import { parseNmask } from "../internal/parsers/ip/nmask.js";
import { parseOspfCfgSet } from "../internal/parsers/ip/ospf-cfg-set.js";
import { parseOspfCfgShow } from "../internal/parsers/ip/ospf-cfg-show.js";
import { parseOspfDis } from "../internal/parsers/ip/ospf-dis.js";
import { parseOspfEn } from "../internal/parsers/ip/ospf-en.js";
import { parseOspfNbr } from "../internal/parsers/ip/ospf-nbr.js";
import { parseOspfStatus } from "../internal/parsers/ip/ospf-status.js";
import { parsePing, type IpPingReport } from "../internal/parsers/ip/ping.js";
import { parsePolicyRt } from "../internal/parsers/ip/policyrt.js";
import { parsePubaddr } from "../internal/parsers/ip/pubaddr.js";
import { parsePubmask } from "../internal/parsers/ip/pubmask.js";
import { parsePubsubnet } from "../internal/parsers/ip/pubsubnet.js";
import { parseRip } from "../internal/parsers/ip/rip.js";
import { parseRoute } from "../internal/parsers/ip/route.js";
import { parseSession } from "../internal/parsers/ip/session.js";
import { parseSpoofdef } from "../internal/parsers/ip/spoofdef.js";
import { parseTracert, type IpTracertReport } from "../internal/parsers/ip/tracert.js";
import { parseWanrip } from "../internal/parsers/ip/wanrip.js";
import { parseRawText, type RawCommandOutput } from "../internal/parsers/ip/shared.js";
import {
  assertArgsShape,
  assertCliValue,
  assertInteger,
  assertIntegerInRange,
  assertIpv4,
  assertKnownFlags,
  assertMac,
  assertMaxLength,
  assertNonNegativeInteger,
  assertNumberOneOf,
  assertOneOf,
  assertPositiveInteger,
  assertTrailingText,
  assertTupleLength,
  defineCommandOperation,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

function ipv4ToNumber(value: string): number {
  return value.split(".").reduce((total, octet) => total * 256 + Number(octet), 0);
}

/** A valid IPv4 netmask: contiguous leading one-bits (e.g. 255.255.255.0). */
function assertNetmask(value: string, name: string): void {
  assertIpv4(value, name);

  const inverted = 0xffffffff - ipv4ToNumber(value);

  if ((inverted & (inverted + 1)) !== 0) {
    throw new InvalidInputError(`${name} must be a contiguous netmask (got "${value}").`);
  }
}

function assertIpv4Range(start: string, end: string, startName: string, endName: string): void {
  assertIpv4(start, startName);
  assertIpv4(end, endName);

  if (ipv4ToNumber(start) > ipv4ToNumber(end)) {
    throw new InvalidInputError(
      `${startName} must not be greater than ${endName} (got ${start}-${end}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.ip.pubsubnet -- `ip pubsubnet <Enable/Disable>` (rawLine 984)
// ---------------------------------------------------------------------------

export interface IpPubsubnetInput {
  readonly enabled: boolean;
}

function buildPubsubnetFrames(input: IpPubsubnetInput): readonly CommandFrame[] {
  return [frameSingleCommand(`ip pubsubnet ${input.enabled ? "enable" : "disable"}`)];
}

export const ipPubsubnet: TypedOperation<IpPubsubnetInput, RawCommandOutput> = {
  manifestId: "cli.ip.pubsubnet",
  classification: "write",
  buildFrames: buildPubsubnetFrames,
  parse: (exchanges) => parsePubsubnet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.pubaddr -- `ip pubaddr <public subnet IP address>` (rawLine 996)
// ---------------------------------------------------------------------------

export interface IpPubaddrInput {
  readonly ipv4Address: string;
}

function buildPubaddrFrames(input: IpPubaddrInput): readonly CommandFrame[] {
  assertIpv4(input.ipv4Address, "ipv4Address");

  return [frameSingleCommand(`ip pubaddr ${input.ipv4Address}`)];
}

export const ipPubaddr: TypedOperation<IpPubaddrInput, RawCommandOutput> = {
  manifestId: "cli.ip.pubaddr",
  classification: "write",
  buildFrames: buildPubaddrFrames,
  parse: (exchanges) => parsePubaddr(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.pubmask -- `ip pubmask <public subnet mask>` (rawLine 1014)
// ---------------------------------------------------------------------------

export interface IpPubmaskInput {
  readonly netmask: string;
}

function buildPubmaskFrames(input: IpPubmaskInput): readonly CommandFrame[] {
  assertIpv4(input.netmask, "netmask");

  return [frameSingleCommand(`ip pubmask ${input.netmask}`)];
}

export const ipPubmask: TypedOperation<IpPubmaskInput, RawCommandOutput> = {
  manifestId: "cli.ip.pubmask",
  classification: "write",
  buildFrames: buildPubmaskFrames,
  parse: (exchanges) => parsePubmask(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.lanalias -- `ip lanalias <idx> -e <0/1>` / `-a <ip>` / `-w <n>` /
// `-r` (rawLine 1035)
// ---------------------------------------------------------------------------

export type IpLanAliasInput =
  | { readonly idx: number; readonly action: "enable"; readonly enabled: boolean }
  | { readonly idx: number; readonly action: "setAux"; readonly ipv4Address: string }
  | { readonly idx: number; readonly action: "assignWan"; readonly wanNumber: number }
  | { readonly idx: number; readonly action: "removeWan" };

function buildLanAliasFrames(input: IpLanAliasInput): readonly CommandFrame[] {
  assertIntegerInRange(input.idx, 1, 5, "idx");

  const prefix = `ip lanalias ${String(input.idx)}`;

  switch (input.action) {
    case "enable": {
      return [frameSingleCommand(`${prefix} -e ${input.enabled ? "1" : "0"}`)];
    }
    case "setAux": {
      assertIpv4(input.ipv4Address, "ipv4Address");

      return [frameSingleCommand(`${prefix} -a ${input.ipv4Address}`)];
    }
    case "assignWan": {
      assertIntegerInRange(input.wanNumber, 0, 5, "wanNumber");

      return [frameSingleCommand(`${prefix} -w ${String(input.wanNumber)}`)];
    }
    case "removeWan": {
      return [frameSingleCommand(`${prefix} -r`)];
    }
  }
}

export const ipLanAlias: TypedOperation<IpLanAliasInput, RawCommandOutput> = {
  manifestId: "cli.ip.lanalias",
  classification: "write",
  buildFrames: buildLanAliasFrames,
  parse: (exchanges) => parseLanAlias(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.addr -- `ip addr <IP address>` (rawLine 1057)
// ---------------------------------------------------------------------------

export interface IpAddrInput {
  readonly ipv4Address: string;
}

function buildAddrFrames(input: IpAddrInput): readonly CommandFrame[] {
  assertIpv4(input.ipv4Address, "ipv4Address");

  return [frameSingleCommand(`ip addr ${input.ipv4Address}`)];
}

export const ipAddr: TypedOperation<IpAddrInput, RawCommandOutput> = {
  manifestId: "cli.ip.addr",
  classification: "write",
  buildFrames: buildAddrFrames,
  parse: (exchanges) => parseAddr(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.nmask -- `ip nmask <IP netmask>` (rawLine 1081)
// ---------------------------------------------------------------------------

export interface IpNmaskInput {
  readonly netmask: string;
}

function buildNmaskFrames(input: IpNmaskInput): readonly CommandFrame[] {
  assertIpv4(input.netmask, "netmask");

  return [frameSingleCommand(`ip nmask ${input.netmask}`)];
}

export const ipNmask: TypedOperation<IpNmaskInput, RawCommandOutput> = {
  manifestId: "cli.ip.nmask",
  classification: "write",
  buildFrames: buildNmaskFrames,
  parse: (exchanges) => parseNmask(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.arp -- `ip arp status` / `ip arp accept status` (rawLine 1091) --
// read-only query variants only.
//
// Sibling-live-verified correction (root audit, 2026-09-13,
// `ARCHITECTURE.md`'s "sibling-live-verified" amendment): the manifest entry
// `cli.ip.arp` is classified `"read"` from `vigor3912s-mcp`'s live-verified
// fw 4.4.7_RC2 registry (`ip_arp_status`), which corrected the prior
// `command-map-family` `"write"` classification.
//
// S2 (`IMPLEMENTATION.md`, `BACKLOG.md` "Tracked follow-up" 2026-09-13): the
// heading's genuinely mutating sub-forms (`add`/`del`/`flush`) now have
// their own accurately classified manifest entries below
// (`cli.ip.arp.add`/`.del`/`.flush`, via `SPLIT_FAMILIES` in
// `tools/generate-capability-manifest.ts`, same split mechanism as `sys
// cfg`/`mngt rmtcfg`/`linux`) instead of remaining permanently
// unrepresented. `accept <value>`/`setCacheLife` stay a deliberate YAGNI
// deferral (not named in this task's scope).
// ---------------------------------------------------------------------------

export type IpArpInput = { readonly action: "status" } | { readonly action: "acceptStatus" };

function buildArpFrames(input: IpArpInput): readonly CommandFrame[] {
  switch (input.action) {
    case "status": {
      return [frameSingleCommand("ip arp status")];
    }
    case "acceptStatus": {
      return [frameSingleCommand("ip arp accept status")];
    }
  }
}

export const ipArp: TypedOperation<IpArpInput, RawCommandOutput> = {
  manifestId: "cli.ip.arp",
  classification: "read",
  buildFrames: buildArpFrames,
  parse: (exchanges) => parseArp(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.arp.add / .del / .flush -- `ip arp add <IP> <MAC> <LAN or WAN>`,
// `ip arp del <IP><LAN or WAN>`, `ip arp flush` (rawLine 1094-1096).
// ---------------------------------------------------------------------------

const ARP_DIRECTIONS = ["LAN", "WAN"] as const;

export interface IpArpAddInput {
  readonly ipv4Address: string;
  readonly mac: string;
  readonly direction: (typeof ARP_DIRECTIONS)[number];
}

export const ipArpAdd: TypedOperation<IpArpAddInput, RawCommandOutput> = {
  manifestId: "cli.ip.arp.add",
  classification: "write",
  buildFrames: (input) => {
    assertIpv4(input.ipv4Address, "ipv4Address");
    assertMac(input.mac, "mac");
    assertOneOf(input.direction, ARP_DIRECTIONS, "direction");

    return [frameSingleCommand(`ip arp add ${input.ipv4Address} ${input.mac} ${input.direction}`)];
  },
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

export interface IpArpDelInput {
  readonly ipv4Address: string;
  readonly direction: (typeof ARP_DIRECTIONS)[number];
}

export const ipArpDel: TypedOperation<IpArpDelInput, RawCommandOutput> = {
  manifestId: "cli.ip.arp.del",
  classification: "write",
  buildFrames: (input) => {
    assertIpv4(input.ipv4Address, "ipv4Address");
    assertOneOf(input.direction, ARP_DIRECTIONS, "direction");

    return [frameSingleCommand(`ip arp del ${input.ipv4Address} ${input.direction}`)];
  },
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

export const ipArpFlush: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.arp.flush",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip arp flush")],
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// cli.ip.arp.accept -- `ip arp accept <0..7>` (rawLine 1098): accept/reject
// illegal source/destination MAC and VRRP MAC (the `status` form is the read
// `cli.ip.arp` `acceptStatus` action).
export interface IpArpAcceptInput {
  readonly mode: number;
}

export const ipArpAccept: TypedOperation<IpArpAcceptInput, RawCommandOutput> = {
  manifestId: "cli.ip.arp.accept",
  classification: "write",
  buildFrames: (input) => {
    assertIntegerInRange(input.mode, 0, 7, "mode");

    return [frameSingleCommand(`ip arp accept ${String(input.mode)}`)];
  },
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// cli.ip.arp.setcachelife -- `ip arp setCacheLife <time>` (rawLine 1099):
// "Available settings will be 10, 20, 30,....2550 seconds".
export interface IpArpSetCacheLifeInput {
  readonly seconds: number;
}

export const ipArpSetCacheLife: TypedOperation<IpArpSetCacheLifeInput, RawCommandOutput> = {
  manifestId: "cli.ip.arp.setcachelife",
  classification: "write",
  buildFrames: (input) => {
    assertIntegerInRange(input.seconds, 10, 2550, "seconds");

    if (input.seconds % 10 !== 0) {
      throw new InvalidInputError(
        `seconds must be a multiple of 10 (got ${String(input.seconds)}).`,
      );
    }

    return [frameSingleCommand(`ip arp setCacheLife ${String(input.seconds)}`)];
  },
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.dhcpc -- `status` / `release` / `renew` and the custom DHCP client
// `option` forms (rawLine 1145): bare `option`, `-h`, `-l` (list), `-d
// <idx>` (delete), `-u <idx>` (update), `-r` (remove all, from the
// parameter table) and `-e -w -c` with the value given as a string (`-v`),
// raw hex bytes (`-x`) or an address list (`-a`).
// ---------------------------------------------------------------------------

export type IpDhcpcInput =
  | { readonly action: "status" }
  | { readonly action: "release"; readonly wanNumber: number }
  | { readonly action: "renew"; readonly wanNumber: number }
  | {
      readonly action: "setOption";
      readonly enabled: boolean;
      readonly wanNumber: number;
      readonly optionNumber: number;
      readonly value: string;
      /** How `value` is encoded: string (`-v`, default), raw hex (`-x`), address list (`-a`). */
      readonly valueType?: "string" | "hex" | "address";
    }
  | { readonly action: "option" | "optionHelp" | "optionList" | "optionRemoveAll" }
  | { readonly action: "optionDelete" | "optionUpdate"; readonly index: number };

const DHCPC_OPTION_FLAG = {
  option: "",
  optionHelp: " -h",
  optionList: " -l",
  optionRemoveAll: " -r",
} as const;

const DHCPC_VALUE_FLAG = { string: "-v", hex: "-x", address: "-a" } as const;

function buildDhcpcFrames(input: IpDhcpcInput): readonly CommandFrame[] {
  switch (input.action) {
    case "status": {
      return [frameSingleCommand("ip dhcpc status")];
    }
    case "release": {
      assertIntegerInRange(input.wanNumber, 1, 12, "wanNumber");

      return [frameSingleCommand(`ip dhcpc release ${String(input.wanNumber)}`)];
    }
    case "renew": {
      assertIntegerInRange(input.wanNumber, 1, 12, "wanNumber");

      return [frameSingleCommand(`ip dhcpc renew ${String(input.wanNumber)}`)];
    }
    case "setOption": {
      assertIntegerInRange(input.wanNumber, 1, 12, "wanNumber");
      assertIntegerInRange(input.optionNumber, 0, 255, "optionNumber");
      assertCliValue(input.value, "value");

      const valueType = input.valueType ?? "string";
      assertOneOf(valueType, ["string", "hex", "address"], "valueType");

      return [
        frameSingleCommand(
          `ip dhcpc option -e ${input.enabled ? "1" : "0"} -w ${String(input.wanNumber)} -c ${String(input.optionNumber)} ${DHCPC_VALUE_FLAG[valueType]} ${input.value}`,
        ),
      ];
    }
    case "option":
    case "optionHelp":
    case "optionList":
    case "optionRemoveAll":
      return [frameSingleCommand(`ip dhcpc option${DHCPC_OPTION_FLAG[input.action]}`)];
    case "optionDelete":
    case "optionUpdate":
      assertPositiveInteger(input.index, "index");

      return [
        frameSingleCommand(
          `ip dhcpc option ${input.action === "optionDelete" ? "-d" : "-u"} ${String(input.index)}`,
        ),
      ];
  }
}

export const ipDhcpc: TypedOperation<IpDhcpcInput, RawCommandOutput> = {
  manifestId: "cli.ip.dhcpc",
  classification: "write",
  buildFrames: buildDhcpcFrames,
  parse: (exchanges) => parseDhcpc(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.ping -- `ip ping <IP address> <AUTO/WAN1/WAN2>` (rawLine 1205) --
// read; 60s `executionOverride` diagnostic exception (`ARCH#Item-3`).
// Optional trailing `<Source IP Address>` (requires `wanInterface`).
// ---------------------------------------------------------------------------

export interface IpPingInput {
  readonly targetIp: string;
  readonly wanInterface?: "AUTO" | "WAN1" | "WAN2";
  /** Source IP for the ping; requires `wanInterface`. */
  readonly sourceIp?: string;
}

function buildPingFrames(input: IpPingInput): readonly CommandFrame[] {
  assertIpv4(input.targetIp, "targetIp");

  if (input.wanInterface !== undefined) {
    assertOneOf(input.wanInterface, ["AUTO", "WAN1", "WAN2"], "wanInterface");
  }

  if (input.sourceIp !== undefined) {
    if (input.wanInterface === undefined) {
      throw new InvalidInputError("sourceIp requires wanInterface.");
    }

    assertIpv4(input.sourceIp, "sourceIp");
  }

  const suffix = [input.wanInterface, input.sourceIp]
    .filter((part) => part !== undefined)
    .map((part) => ` ${part}`)
    .join("");

  return [frameSingleCommand(`ip ping ${input.targetIp}${suffix}`)];
}

export const ipPing: TypedOperation<IpPingInput, IpPingReport> = {
  manifestId: "cli.ip.ping",
  classification: "read",
  buildFrames: buildPingFrames,
  parse: (exchanges) => parsePing(firstExchangeText(exchanges)),
  executionOverride: { commandTimeoutMs: 60_000 },
};

// ---------------------------------------------------------------------------
// cli.ip.tracert -- `ip tracert <Host/IP address> <WAN1..WAN12> <Udp/Icmp>`
// (rawLine 1225) -- read; 60s `executionOverride` diagnostic exception
// (`ARCH#Item-3`).
// ---------------------------------------------------------------------------

const TRACERT_WAN_LABELS = [
  "WAN1",
  "WAN2",
  "WAN3",
  "WAN4",
  "WAN5",
  "WAN6",
  "WAN7",
  "WAN8",
  "WAN9",
  "WAN10",
  "WAN11",
  "WAN12",
] as const;

export interface IpTracertInput {
  readonly targetIp: string;
  readonly wanInterface?: (typeof TRACERT_WAN_LABELS)[number];
  readonly protocol?: "Udp" | "Icmp";
}

function buildTracertFrames(input: IpTracertInput): readonly CommandFrame[] {
  assertIpv4(input.targetIp, "targetIp");

  if (input.wanInterface !== undefined) {
    assertOneOf(input.wanInterface, TRACERT_WAN_LABELS, "wanInterface");
  }

  if (input.protocol !== undefined) {
    assertOneOf(input.protocol, ["Udp", "Icmp"], "protocol");

    if (input.wanInterface === undefined) {
      throw new InvalidInputError(
        "protocol requires wanInterface to also be provided (documented order).",
      );
    }
  }

  const wanSuffix = input.wanInterface === undefined ? "" : ` ${input.wanInterface}`;
  const protocolSuffix = input.protocol === undefined ? "" : ` ${input.protocol}`;

  return [frameSingleCommand(`ip tracert ${input.targetIp}${wanSuffix}${protocolSuffix}`)];
}

export const ipTracert: TypedOperation<IpTracertInput, IpTracertReport> = {
  manifestId: "cli.ip.tracert",
  classification: "read",
  buildFrames: buildTracertFrames,
  parse: (exchanges) => parseTracert(firstExchangeText(exchanges)),
  executionOverride: { commandTimeoutMs: 60_000 },
};

// ---------------------------------------------------------------------------
// cli.ip.route -- `ip route status` (rawLine 1310) -- read-only query only.
//
// Sibling-live-verified correction (root audit, 2026-09-13): the manifest
// entry `cli.ip.route` is now classified `"read"` from `vigor3912s-mcp`'s
// live-verified `ip_route_status`, correcting the prior `command-map-family`
// `"write"` classification.
//
// S2 (`IMPLEMENTATION.md`, `BACKLOG.md` "Tracked follow-up" 2026-09-13): the
// heading's `add`/`del`/`default`/`clean` write sub-forms now have their own
// accurately classified manifest entries below, via `SPLIT_FAMILIES`. `cnc`/
// `tel` stay a deliberate YAGNI deferral (not named in this task's scope).
// ---------------------------------------------------------------------------

function buildRouteFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("ip route status")];
}

export const ipRoute: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.route",
  classification: "read",
  buildFrames: buildRouteFrames,
  parse: (exchanges) => parseRoute(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.route.add -- `ip route add <dst> <netmask> <gateway> <ifno>
// <rtype>` (rawLine 1313). `ifno` is the documented "3=WAN1 .. 12=WAN10"
// connection-interface index.
// ---------------------------------------------------------------------------

const ROUTE_TYPES = ["default", "static"] as const;

export interface IpRouteAddInput {
  readonly dst: string;
  readonly netmask: string;
  readonly gateway: string;
  readonly ifno: number;
  readonly rtype: (typeof ROUTE_TYPES)[number];
}

export const ipRouteAdd: TypedOperation<IpRouteAddInput, RawCommandOutput> = {
  manifestId: "cli.ip.route.add",
  classification: "write",
  buildFrames: (input) => {
    assertIpv4(input.dst, "dst");
    assertNetmask(input.netmask, "netmask");
    assertIpv4(input.gateway, "gateway");
    assertIntegerInRange(input.ifno, 3, 12, "ifno");
    assertOneOf(input.rtype, ROUTE_TYPES, "rtype");

    return [
      frameSingleCommand(
        `ip route add ${input.dst} ${input.netmask} ${input.gateway} ${String(input.ifno)} ${input.rtype}`,
      ),
    ];
  },
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// cli.ip.route.del -- `ip route del <dst> <netmask><rtype>` (rawLine 1314).
export interface IpRouteDelInput {
  readonly dst: string;
  readonly netmask: string;
  readonly rtype: (typeof ROUTE_TYPES)[number];
}

export const ipRouteDel: TypedOperation<IpRouteDelInput, RawCommandOutput> = {
  manifestId: "cli.ip.route.del",
  classification: "write",
  buildFrames: (input) => {
    assertIpv4(input.dst, "dst");
    assertNetmask(input.netmask, "netmask");
    assertOneOf(input.rtype, ROUTE_TYPES, "rtype");

    return [frameSingleCommand(`ip route del ${input.dst} ${input.netmask} ${input.rtype}`)];
  },
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// cli.ip.route.cnc / .tel -- `ip route cnc|tel` (rawLine 1316/1317): display
// the CNC / China Telecom network IP ranges (read).
export const ipRouteCnc: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.route.cnc",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip route cnc")],
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

export const ipRouteTel: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.route.tel",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip route tel")],
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// cli.ip.route.default -- `ip route default <add/del/off/?>` (rawLine 1318).
// Destructive: `del`/`off` remove the default route and cut WAN reachability,
// including the management session. `?` is the generic help query.
const ROUTE_DEFAULT_MODES = ["add", "del", "off"] as const;

export interface IpRouteDefaultInput {
  readonly mode: (typeof ROUTE_DEFAULT_MODES)[number];
}

export const ipRouteDefault: TypedOperation<IpRouteDefaultInput, RawCommandOutput> = {
  manifestId: "cli.ip.route.default",
  classification: "destructive",
  buildFrames: (input) => {
    assertOneOf(input.mode, ROUTE_DEFAULT_MODES, "mode");

    return [frameSingleCommand(`ip route default ${input.mode}`)];
  },
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// cli.ip.route.clean -- `ip route clean <1/0>` (rawLine 1319). Destructive:
// the manual documents it as "Clean all of the route settings".
export interface IpRouteCleanInput {
  readonly enabled: boolean;
}

export const ipRouteClean: TypedOperation<IpRouteCleanInput, RawCommandOutput> = {
  manifestId: "cli.ip.route.clean",
  classification: "destructive",
  buildFrames: (input) => [frameSingleCommand(`ip route clean ${input.enabled ? "1" : "0"}`)],
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.session -- `ip session status` / `ip session show` (rawLine 1442) --
// read-only query variants. Classified `"read"` from `vigor3912s-mcp`'s
// live-verified `ip_session` (sibling-live-verified correction, 2026-09-13).
// Every other documented sub-form has its own manifest entry below (split
// via `SPLIT_FAMILIES`), plus the live-only bare `ip session`
// (`cli.ip.session.list`, live-firmware-recon).
// ---------------------------------------------------------------------------

export type IpSessionInput = { readonly action: "status" } | { readonly action: "show" };

function buildSessionFrames(input: IpSessionInput): readonly CommandFrame[] {
  switch (input.action) {
    case "status": {
      return [frameSingleCommand("ip session status")];
    }
    case "show": {
      return [frameSingleCommand("ip session show")];
    }
  }
}

export const ipSession: TypedOperation<IpSessionInput, RawCommandOutput> = {
  manifestId: "cli.ip.session",
  classification: "read",
  buildFrames: buildSessionFrames,
  parse: (exchanges) => parseSession(firstExchangeText(exchanges)),
};

// cli.ip.session.list -- bare `ip session` (live-firmware-recon; not in the
// Part VIII PDF). Output shape not captured -> raw text.
export const ipSessionList: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.session.list",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip session")],
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// cli.ip.session.on / .off -- `ip session on|off` (rawLine 1446/1447):
// turn the per-IP session limit on/off.
export const ipSessionOn: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.session.on",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip session on")],
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

export const ipSessionOff: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.session.off",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip session off")],
  parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
};

// cli.ip.session.default / .defaultp2p / .timer -- `ip session
// default|defaultp2p|timer <num>` (rawLine 1448/1449/1452): default session
// limit, default P2P session limit, block timer (seconds).
export interface IpSessionNumberInput {
  readonly value: number;
}

function sessionNumberOperation(
  manifestId: string,
  keyword: "default" | "defaultp2p" | "timer",
): TypedOperation<IpSessionNumberInput, RawCommandOutput> {
  return {
    manifestId,
    classification: "write",
    buildFrames: (input) => {
      assertNonNegativeInteger(input.value, "value");

      return [frameSingleCommand(`ip session ${keyword} ${String(input.value)}`)];
    },
    parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
  };
}

export const ipSessionDefault = sessionNumberOperation("cli.ip.session.default", "default");
export const ipSessionDefaultP2p = sessionNumberOperation(
  "cli.ip.session.defaultp2p",
  "defaultp2p",
);
export const ipSessionTimer = sessionNumberOperation("cli.ip.session.timer", "timer");

// cli.ip.session.block / .unblock -- `ip session <block/unblock><IP>`
// (rawLine 1453): block/unblock Internet access for one IP.
export interface IpSessionHostInput {
  readonly ipv4Address: string;
}

function sessionHostOperation(
  manifestId: string,
  keyword: "block" | "unblock",
): TypedOperation<IpSessionHostInput, RawCommandOutput> {
  return {
    manifestId,
    classification: "write",
    buildFrames: (input) => {
      assertIpv4(input.ipv4Address, "ipv4Address");

      return [frameSingleCommand(`ip session ${keyword} ${input.ipv4Address}`)];
    },
    parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
  };
}

export const ipSessionBlock = sessionHostOperation("cli.ip.session.block", "block");
export const ipSessionUnblock = sessionHostOperation("cli.ip.session.unblock", "unblock");

// cli.ip.session.add / .del -- `ip session <add/del><IP1-IP2> <num>
// <p2pnum>` (rawLine 1454): add/delete a session limit for an IP range.
export interface IpSessionRangeInput {
  readonly ip1: string;
  readonly ip2: string;
  readonly num: number;
  readonly p2pNum: number;
}

function sessionRangeOperation(
  manifestId: string,
  keyword: "add" | "del",
): TypedOperation<IpSessionRangeInput, RawCommandOutput> {
  return {
    manifestId,
    classification: "write",
    buildFrames: (input) => {
      assertIpv4Range(input.ip1, input.ip2, "ip1", "ip2");
      assertNonNegativeInteger(input.num, "num");
      assertNonNegativeInteger(input.p2pNum, "p2pNum");

      return [
        frameSingleCommand(
          `ip session ${keyword} ${input.ip1}-${input.ip2} ${String(input.num)} ${String(input.p2pNum)}`,
        ),
      ];
    },
    parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
  };
}

export const ipSessionAdd = sessionRangeOperation("cli.ip.session.add", "add");
export const ipSessionDel = sessionRangeOperation("cli.ip.session.del", "del");

// ---------------------------------------------------------------------------
// cli.ip.bandwidth -- `ip bandwidth on/off` / `default <tx> <rx>` /
// `status` / `show` / `routing <on/off>` / `schedule <s1..s4>` /
// `<add/del> <IP1-IP2> <tx> <rx> <shared>` (rawLine 1492)
// ---------------------------------------------------------------------------

export type IpBandwidthInput =
  | { readonly action: "state"; readonly enabled: boolean }
  | { readonly action: "default"; readonly txRateKbps: number; readonly rxRateKbps: number }
  | { readonly action: "status" }
  | { readonly action: "show" }
  | { readonly action: "routing"; readonly enabled: boolean }
  | {
      readonly action: "schedule";
      readonly profiles: readonly [number, number, number, number];
    }
  | {
      readonly action: "addRange";
      readonly ipStart: string;
      readonly ipEnd: string;
      readonly txRateKbps: number;
      readonly rxRateKbps: number;
      readonly shared: boolean;
    }
  | {
      readonly action: "delRange";
      readonly ipStart: string;
      readonly ipEnd: string;
      readonly txRateKbps: number;
      readonly rxRateKbps: number;
      readonly shared: boolean;
    };

function assertBandwidthRate(value: number, name: string): void {
  assertIntegerInRange(value, 0, 30_000, name);
}

function buildBandwidthFrames(input: IpBandwidthInput): readonly CommandFrame[] {
  switch (input.action) {
    case "state": {
      return [frameSingleCommand(`ip bandwidth ${input.enabled ? "on" : "off"}`)];
    }
    case "default": {
      assertBandwidthRate(input.txRateKbps, "txRateKbps");
      assertBandwidthRate(input.rxRateKbps, "rxRateKbps");

      return [
        frameSingleCommand(
          `ip bandwidth default ${String(input.txRateKbps)} ${String(input.rxRateKbps)}`,
        ),
      ];
    }
    case "status": {
      return [frameSingleCommand("ip bandwidth status")];
    }
    case "show": {
      return [frameSingleCommand("ip bandwidth show")];
    }
    case "routing": {
      return [frameSingleCommand(`ip bandwidth routing ${input.enabled ? "on" : "off"}`)];
    }
    case "schedule": {
      assertTupleLength(input.profiles, 4, "profiles");

      for (const profile of input.profiles) {
        assertIntegerInRange(profile, 1, 16, "each profile in profiles");
      }

      return [frameSingleCommand(`ip bandwidth schedule ${input.profiles.map(String).join(" ")}`)];
    }
    case "addRange": {
      assertIpv4(input.ipStart, "ipStart");
      assertIpv4(input.ipEnd, "ipEnd");
      assertBandwidthRate(input.txRateKbps, "txRateKbps");
      assertBandwidthRate(input.rxRateKbps, "rxRateKbps");

      return [
        frameSingleCommand(
          `ip bandwidth add ${input.ipStart}-${input.ipEnd} ${String(input.txRateKbps)} ${String(input.rxRateKbps)} ${input.shared ? "1" : "0"}`,
        ),
      ];
    }
    case "delRange": {
      assertIpv4(input.ipStart, "ipStart");
      assertIpv4(input.ipEnd, "ipEnd");
      assertBandwidthRate(input.txRateKbps, "txRateKbps");
      assertBandwidthRate(input.rxRateKbps, "rxRateKbps");

      return [
        frameSingleCommand(
          `ip bandwidth del ${input.ipStart}-${input.ipEnd} ${String(input.txRateKbps)} ${String(input.rxRateKbps)} ${input.shared ? "1" : "0"}`,
        ),
      ];
    }
  }
}

export const ipBandwidth: TypedOperation<IpBandwidthInput, RawCommandOutput> = {
  manifestId: "cli.ip.bandwidth",
  classification: "write",
  buildFrames: buildBandwidthFrames,
  parse: (exchanges) => parseBandwidth(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.bindmac -- `ip bindmac on/off/strict_on/strict_off` / `add <IP>
// <MAC> <Comment>` / `del <IP/all>` / `subnet <all/set/unset/clear/show>` /
// `show` (rawLine 1555)
// ---------------------------------------------------------------------------

export type IpBindmacInput =
  | { readonly action: "mode"; readonly mode: "on" | "off" | "strict_on" | "strict_off" }
  | {
      readonly action: "add";
      readonly ipv4Address: string;
      readonly mac: string;
      readonly comment: string;
    }
  | { readonly action: "del"; readonly target: string }
  | { readonly action: "subnetAll" }
  | { readonly action: "subnetSet"; readonly lanIndex: number }
  | { readonly action: "subnetUnset"; readonly lanIndex: number }
  | { readonly action: "subnetClear" }
  | { readonly action: "subnetShow" }
  | { readonly action: "show" };

function assertDelTarget(value: string): void {
  if (value === "all") {
    return;
  }

  assertIpv4(value, "target");
}

function buildBindmacFrames(input: IpBindmacInput): readonly CommandFrame[] {
  switch (input.action) {
    case "mode": {
      assertOneOf(input.mode, ["on", "off", "strict_on", "strict_off"], "mode");

      return [frameSingleCommand(`ip bindmac ${input.mode}`)];
    }
    case "add": {
      assertIpv4(input.ipv4Address, "ipv4Address");
      assertMac(input.mac, "mac");
      assertTrailingText(input.comment, "comment");

      return [
        frameSingleCommand(`ip bindmac add ${input.ipv4Address} ${input.mac} ${input.comment}`),
      ];
    }
    case "del": {
      assertDelTarget(input.target);

      return [frameSingleCommand(`ip bindmac del ${input.target}`)];
    }
    case "subnetAll": {
      return [frameSingleCommand("ip bindmac subnet all")];
    }
    case "subnetSet": {
      assertIntegerInRange(input.lanIndex, 1, 8, "lanIndex");

      return [frameSingleCommand(`ip bindmac subnet set LAN${String(input.lanIndex)}`)];
    }
    case "subnetUnset": {
      assertIntegerInRange(input.lanIndex, 1, 8, "lanIndex");

      return [frameSingleCommand(`ip bindmac subnet unset LAN${String(input.lanIndex)}`)];
    }
    case "subnetClear": {
      return [frameSingleCommand("ip bindmac subnet clear")];
    }
    case "subnetShow": {
      return [frameSingleCommand("ip bindmac subnet show")];
    }
    case "show": {
      return [frameSingleCommand("ip bindmac show")];
    }
  }
}

export const ipBindmac: TypedOperation<IpBindmacInput, RawCommandOutput> = {
  manifestId: "cli.ip.bindmac",
  classification: "write",
  buildFrames: buildBindmacFrames,
  parse: (exchanges) => parseBindmac(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.rip -- `ip rip <0/1/2>` (rawLine 1261)
// ---------------------------------------------------------------------------

export interface IpRipInput {
  readonly mode: 0 | 1 | 2;
}

function buildRipFrames(input: IpRipInput): readonly CommandFrame[] {
  assertNumberOneOf(input.mode, [0, 1, 2], "mode");

  return [frameSingleCommand(`ip rip ${String(input.mode)}`)];
}

export const ipRip: TypedOperation<IpRipInput, RawCommandOutput> = {
  manifestId: "cli.ip.rip",
  classification: "write",
  buildFrames: buildRipFrames,
  parse: (exchanges) => parseRip(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.wanrip -- `ip wanrip [ifno] -e [0/1]` (rawLine 1273). Status dump
// lists WAN[1]..WAN[52]; primary form is numeric ifno + enable flag.
// ---------------------------------------------------------------------------

export interface IpWanripInput {
  readonly interfaceNumber: number;
  readonly enabled: boolean;
}

function buildWanripFrames(input: IpWanripInput): readonly CommandFrame[] {
  assertIntegerInRange(input.interfaceNumber, 1, 52, "interfaceNumber");

  return [
    frameSingleCommand(
      `ip wanrip ${String(input.interfaceNumber)} -e ${input.enabled ? "1" : "0"}`,
    ),
  ];
}

export const ipWanrip: TypedOperation<IpWanripInput, RawCommandOutput> = {
  manifestId: "cli.ip.wanrip",
  classification: "write",
  buildFrames: buildWanripFrames,
  parse: (exchanges) => parseWanrip(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.igmpproxy.* -- split from heading `ip igmp_proxy` (rawLine 1356).
// `wan` is modelled as the bare Syntax line (`ip igmp_proxy wan`); the prose
// says "specify WAN interface" but documents no argument shape -- deferred.
// ---------------------------------------------------------------------------

export const ipIgmpProxyStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.igmpproxy.status",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip igmp_proxy status")],
  parse: (exchanges) => parseIgmpProxyStatus(firstExchangeText(exchanges)),
};

export const ipIgmpProxySet: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.igmpproxy.set",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip igmp_proxy set")],
  parse: (exchanges) => parseIgmpProxySet(firstExchangeText(exchanges)),
};

export const ipIgmpProxyReset: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.igmpproxy.reset",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip igmp_proxy reset")],
  parse: (exchanges) => parseIgmpProxyReset(firstExchangeText(exchanges)),
};

export const ipIgmpProxyWan: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.igmpproxy.wan",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip igmp_proxy wan")],
  parse: (exchanges) => parseIgmpProxyWan(firstExchangeText(exchanges)),
};

export interface IpIgmpProxyQueryInput {
  readonly intervalMs: number;
}

function buildIgmpProxyQueryFrames(input: IpIgmpProxyQueryInput): readonly CommandFrame[] {
  assertInteger(input.intervalMs, "intervalMs");

  if (input.intervalMs < 0) {
    throw new InvalidInputError(
      `intervalMs must not be negative (got ${String(input.intervalMs)}).`,
    );
  }

  return [frameSingleCommand(`ip igmp_proxy query ${String(input.intervalMs)}`)];
}

export const ipIgmpProxyQuery: TypedOperation<IpIgmpProxyQueryInput, RawCommandOutput> = {
  manifestId: "cli.ip.igmpproxy.query",
  classification: "write",
  buildFrames: buildIgmpProxyQueryFrames,
  parse: (exchanges) => parseIgmpProxyQuery(firstExchangeText(exchanges)),
};

export interface IpIgmpProxyPppInput {
  readonly enabled: boolean;
}

function buildIgmpProxyPppFrames(input: IpIgmpProxyPppInput): readonly CommandFrame[] {
  return [frameSingleCommand(`ip igmp_proxy ppp ${input.enabled ? "1" : "0"}`)];
}

export const ipIgmpProxyPpp: TypedOperation<IpIgmpProxyPppInput, RawCommandOutput> = {
  manifestId: "cli.ip.igmpproxy.ppp",
  classification: "write",
  buildFrames: buildIgmpProxyPppFrames,
  parse: (exchanges) => parseIgmpProxyPpp(firstExchangeText(exchanges)),
};

const IGMP_PROXY_VERSIONS = ["v2", "v3", "auto", "show"] as const;

export interface IpIgmpProxyVersionInput {
  /** Omitted: bare `ip igmp_proxy version` (current setting). */
  readonly version?: (typeof IGMP_PROXY_VERSIONS)[number];
}

function buildIgmpProxyVersionFrames(input: IpIgmpProxyVersionInput): readonly CommandFrame[] {
  if (input.version === undefined) {
    return [frameSingleCommand("ip igmp_proxy version")];
  }

  assertOneOf(input.version, IGMP_PROXY_VERSIONS, "version");

  return [frameSingleCommand(`ip igmp_proxy version ${input.version}`)];
}

export const ipIgmpProxyVersion: TypedOperation<IpIgmpProxyVersionInput, RawCommandOutput> = {
  manifestId: "cli.ip.igmpproxy.version",
  classification: "write",
  buildFrames: buildIgmpProxyVersionFrames,
  parse: (exchanges) => parseIgmpProxyVersion(firstExchangeText(exchanges)),
};

export interface IpIgmpProxySyslogInput {
  /** Omitted: bare `ip igmp_proxy syslog` (current setting). */
  readonly enabled?: boolean;
}

function buildIgmpProxySyslogFrames(input: IpIgmpProxySyslogInput): readonly CommandFrame[] {
  if (input.enabled === undefined) {
    return [frameSingleCommand("ip igmp_proxy syslog")];
  }

  return [frameSingleCommand(`ip igmp_proxy syslog ${input.enabled ? "1" : "0"}`)];
}

export const ipIgmpProxySyslog: TypedOperation<IpIgmpProxySyslogInput, RawCommandOutput> = {
  manifestId: "cli.ip.igmpproxy.syslog",
  classification: "write",
  buildFrames: buildIgmpProxySyslogFrames,
  parse: (exchanges) => parseIgmpProxySyslog(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.igmpsnoop.* -- split from heading `ip igmp_snoop` (rawLine 1398)
// ---------------------------------------------------------------------------

export const ipIgmpSnoopStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.igmpsnoop.status",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip igmp_snoop status")],
  parse: (exchanges) => parseIgmpSnoopStatus(firstExchangeText(exchanges)),
};

export const ipIgmpSnoopTable: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.igmpsnoop.table",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip igmp_snoop table")],
  parse: (exchanges) => parseIgmpSnoopTable(firstExchangeText(exchanges)),
};

export const ipIgmpSnoopEnable: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.igmpsnoop.enable",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip igmp_snoop enable")],
  parse: (exchanges) => parseIgmpSnoopEnable(firstExchangeText(exchanges)),
};

export const ipIgmpSnoopDisable: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.igmpsnoop.disable",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip igmp_snoop disable")],
  parse: (exchanges) => parseIgmpSnoopDisable(firstExchangeText(exchanges)),
};

const IGMP_SNOOP_TXQUERY_VERSIONS = ["v2", "v3"] as const;

export interface IpIgmpSnoopTxqueryInput {
  readonly enabled: boolean;
  readonly version: (typeof IGMP_SNOOP_TXQUERY_VERSIONS)[number];
}

function buildIgmpSnoopTxqueryFrames(input: IpIgmpSnoopTxqueryInput): readonly CommandFrame[] {
  assertOneOf(input.version, IGMP_SNOOP_TXQUERY_VERSIONS, "version");

  return [
    frameSingleCommand(`ip igmp_snoop txquery ${input.enabled ? "on" : "off"} ${input.version}`),
  ];
}

export const ipIgmpSnoopTxquery: TypedOperation<IpIgmpSnoopTxqueryInput, RawCommandOutput> = {
  manifestId: "cli.ip.igmpsnoop.txquery",
  classification: "write",
  buildFrames: buildIgmpSnoopTxqueryFrames,
  parse: (exchanges) => parseIgmpSnoopTxquery(firstExchangeText(exchanges)),
};

const IGMP_SNOOP_MODES = ["hw", "sw"] as const;

export interface IpIgmpSnoopModeInput {
  readonly mode: (typeof IGMP_SNOOP_MODES)[number];
}

function buildIgmpSnoopModeFrames(input: IpIgmpSnoopModeInput): readonly CommandFrame[] {
  assertOneOf(input.mode, IGMP_SNOOP_MODES, "mode");

  return [frameSingleCommand(`ip igmp_snoop mode ${input.mode}`)];
}

export const ipIgmpSnoopMode: TypedOperation<IpIgmpSnoopModeInput, RawCommandOutput> = {
  manifestId: "cli.ip.igmpsnoop.mode",
  classification: "write",
  buildFrames: buildIgmpSnoopModeFrames,
  parse: (exchanges) => parseIgmpSnoopMode(firstExchangeText(exchanges)),
};

export interface IpIgmpSnoopOnOffInput {
  readonly enabled: boolean;
}

function buildIgmpSnoopChkleaveFrames(input: IpIgmpSnoopOnOffInput): readonly CommandFrame[] {
  return [frameSingleCommand(`ip igmp_snoop chkleave ${input.enabled ? "on" : "off"}`)];
}

export const ipIgmpSnoopChkleave: TypedOperation<IpIgmpSnoopOnOffInput, RawCommandOutput> = {
  manifestId: "cli.ip.igmpsnoop.chkleave",
  classification: "write",
  buildFrames: buildIgmpSnoopChkleaveFrames,
  parse: (exchanges) => parseIgmpSnoopChkleave(firstExchangeText(exchanges)),
};

function buildIgmpSnoopSeparateFrames(input: IpIgmpSnoopOnOffInput): readonly CommandFrame[] {
  return [frameSingleCommand(`ip igmp_snoop separate ${input.enabled ? "on" : "off"}`)];
}

export const ipIgmpSnoopSeparate: TypedOperation<IpIgmpSnoopOnOffInput, RawCommandOutput> = {
  manifestId: "cli.ip.igmpsnoop.separate",
  classification: "write",
  buildFrames: buildIgmpSnoopSeparateFrames,
  parse: (exchanges) => parseIgmpSnoopSeparate(firstExchangeText(exchanges)),
};

function buildIgmpSnoopPortchkFrames(input: IpIgmpSnoopOnOffInput): readonly CommandFrame[] {
  return [frameSingleCommand(`ip igmp_snoop portchk ${input.enabled ? "on" : "off"}`)];
}

export const ipIgmpSnoopPortchk: TypedOperation<IpIgmpSnoopOnOffInput, RawCommandOutput> = {
  manifestId: "cli.ip.igmpsnoop.portchk",
  classification: "write",
  buildFrames: buildIgmpSnoopPortchkFrames,
  parse: (exchanges) => parseIgmpSnoopPortchk(firstExchangeText(exchanges)),
};

export interface IpIgmpSnoopAcceptlistInput {
  readonly type: 0 | 1 | 2;
  readonly index: number;
}

function buildIgmpSnoopAcceptlistFrames(
  input: IpIgmpSnoopAcceptlistInput,
): readonly CommandFrame[] {
  assertNumberOneOf(input.type, [0, 1, 2], "type");

  if (input.type === 0) {
    assertIntegerInRange(input.index, 0, 0, "index");
  } else if (input.type === 1) {
    assertIntegerInRange(input.index, 0, 500, "index");
  } else {
    assertIntegerInRange(input.index, 0, 32, "index");
  }

  return [
    frameSingleCommand(`ip igmp_snoop acceptlist ${String(input.type)} ${String(input.index)}`),
  ];
}

export const ipIgmpSnoopAcceptlist: TypedOperation<IpIgmpSnoopAcceptlistInput, RawCommandOutput> = {
  manifestId: "cli.ip.igmpsnoop.acceptlist",
  classification: "write",
  buildFrames: buildIgmpSnoopAcceptlistFrames,
  parse: (exchanges) => parseIgmpSnoopAcceptlist(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.dataflowmonitor.* -- split from heading (rawLine 1539)
// ---------------------------------------------------------------------------

export const ipDataflowmonitorStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.dataflowmonitor.status",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip dataflowmonitor status")],
  parse: (exchanges) => parseDataflowmonitorStatus(firstExchangeText(exchanges)),
};

export const ipDataflowmonitorOn: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.dataflowmonitor.on",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip dataflowmonitor on")],
  parse: (exchanges) => parseDataflowmonitorOn(firstExchangeText(exchanges)),
};

export const ipDataflowmonitorOff: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.dataflowmonitor.off",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip dataflowmonitor off")],
  parse: (exchanges) => parseDataflowmonitorOff(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.bgp.* -- split reads + catch-all write (rawLine 1608)
// ---------------------------------------------------------------------------

export const ipBgpShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.bgp.show",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip bgp show")],
  parse: (exchanges) => parseBgpShow(firstExchangeText(exchanges)),
};

export type IpBgpNeighborShowInput =
  { readonly action: "all" } | { readonly action: "index"; readonly idx: number };

function buildBgpNeighborShowFrames(input: IpBgpNeighborShowInput): readonly CommandFrame[] {
  switch (input.action) {
    case "all": {
      return [frameSingleCommand("ip bgp neighbor show all")];
    }
    case "index": {
      assertIntegerInRange(input.idx, 1, 8, "idx");

      return [frameSingleCommand(`ip bgp neighbor ${String(input.idx)} show`)];
    }
  }
}

export const ipBgpNeighborShow: TypedOperation<IpBgpNeighborShowInput, RawCommandOutput> = {
  manifestId: "cli.ip.bgp.neighbor.show",
  classification: "read",
  buildFrames: buildBgpNeighborShowFrames,
  parse: (exchanges) => parseBgpNeighborShow(firstExchangeText(exchanges)),
};

export const ipBgpStaticShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.bgp.static.show",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip bgp static show")],
  parse: (exchanges) => parseBgpStaticShow(firstExchangeText(exchanges)),
};

export type IpBgpInput =
  | { readonly action: "mode"; readonly enabled: boolean }
  | { readonly action: "as"; readonly asNumber: number }
  | { readonly action: "hold"; readonly seconds: number }
  | { readonly action: "retry"; readonly seconds: number }
  | { readonly action: "id"; readonly ipv4Address: string }
  | { readonly action: "neighborMode"; readonly idx: number; readonly enabled: boolean }
  | { readonly action: "neighborName"; readonly idx: number; readonly name: string }
  | { readonly action: "neighborIp"; readonly idx: number; readonly ipv4Address: string }
  | { readonly action: "neighborAs"; readonly idx: number; readonly asNumber: number }
  | { readonly action: "neighborWeight"; readonly idx: number; readonly weight: number }
  | { readonly action: "neighborPrepend"; readonly idx: number; readonly prepend: number }
  | { readonly action: "neighborMd5"; readonly idx: number; readonly enabled: boolean }
  | { readonly action: "neighborKey"; readonly idx: number; readonly key: string }
  | {
      readonly action: "staticSet";
      readonly sidx: number;
      readonly ipv4Address: string;
      readonly netmask: string;
    }
  | { readonly action: "staticDelete"; readonly sidx: number };

function assertBgpNeighborIdx(idx: number): void {
  assertIntegerInRange(idx, 1, 8, "idx");
}

function buildBgpFrames(input: IpBgpInput): readonly CommandFrame[] {
  switch (input.action) {
    case "mode": {
      return [frameSingleCommand(`ip bgp mode ${input.enabled ? "1" : "0"}`)];
    }
    case "as": {
      assertIntegerInRange(input.asNumber, 0, 4_294_967_295, "asNumber");

      return [frameSingleCommand(`ip bgp as ${String(input.asNumber)}`)];
    }
    case "hold": {
      assertIntegerInRange(input.seconds, 10, 65_535, "seconds");

      return [frameSingleCommand(`ip bgp hold ${String(input.seconds)}`)];
    }
    case "retry": {
      assertIntegerInRange(input.seconds, 3, 255, "seconds");

      return [frameSingleCommand(`ip bgp retry ${String(input.seconds)}`)];
    }
    case "id": {
      assertIpv4(input.ipv4Address, "ipv4Address");

      return [frameSingleCommand(`ip bgp id ${input.ipv4Address}`)];
    }
    case "neighborMode": {
      assertBgpNeighborIdx(input.idx);

      return [
        frameSingleCommand(
          `ip bgp neighbor ${String(input.idx)} mode ${input.enabled ? "1" : "0"}`,
        ),
      ];
    }
    case "neighborName": {
      assertBgpNeighborIdx(input.idx);
      assertCliValue(input.name, "name");
      assertMaxLength(input.name, 20, "name");
      assertCliValue(input.name, "name");

      return [frameSingleCommand(`ip bgp neighbor ${String(input.idx)} name ${input.name}`)];
    }
    case "neighborIp": {
      assertBgpNeighborIdx(input.idx);
      assertIpv4(input.ipv4Address, "ipv4Address");

      return [frameSingleCommand(`ip bgp neighbor ${String(input.idx)} ip ${input.ipv4Address}`)];
    }
    case "neighborAs": {
      assertBgpNeighborIdx(input.idx);
      assertIntegerInRange(input.asNumber, 1, 4_294_967_295, "asNumber");

      return [
        frameSingleCommand(`ip bgp neighbor ${String(input.idx)} as ${String(input.asNumber)}`),
      ];
    }
    case "neighborWeight": {
      assertBgpNeighborIdx(input.idx);
      assertIntegerInRange(input.weight, 0, 7, "weight");

      return [
        frameSingleCommand(`ip bgp neighbor ${String(input.idx)} weight ${String(input.weight)}`),
      ];
    }
    case "neighborPrepend": {
      assertBgpNeighborIdx(input.idx);
      assertIntegerInRange(input.prepend, 0, 7, "prepend");

      return [
        frameSingleCommand(`ip bgp neighbor ${String(input.idx)} prepend ${String(input.prepend)}`),
      ];
    }
    case "neighborMd5": {
      assertBgpNeighborIdx(input.idx);

      return [
        frameSingleCommand(`ip bgp neighbor ${String(input.idx)} md5 ${input.enabled ? "1" : "0"}`),
      ];
    }
    case "neighborKey": {
      assertBgpNeighborIdx(input.idx);
      assertCliValue(input.key, "key");
      assertMaxLength(input.key, 20, "key");
      assertCliValue(input.key, "key");

      return [frameSingleCommand(`ip bgp neighbor ${String(input.idx)} key ${input.key}`)];
    }
    case "staticSet": {
      assertIntegerInRange(input.sidx, 1, 16, "sidx");
      assertIpv4(input.ipv4Address, "ipv4Address");
      assertIpv4(input.netmask, "netmask");

      return [
        frameSingleCommand(
          `ip bgp static ${String(input.sidx)} ${input.ipv4Address} ${input.netmask}`,
        ),
      ];
    }
    case "staticDelete": {
      assertIntegerInRange(input.sidx, 1, 16, "sidx");

      return [frameSingleCommand(`ip bgp static ${String(input.sidx)} delete`)];
    }
  }
}

export const ipBgp: TypedOperation<IpBgpInput, RawCommandOutput> = {
  manifestId: "cli.ip.bgp",
  classification: "write",
  buildFrames: buildBgpFrames,
  parse: (exchanges) => parseBgp(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.ospf.* -- split from heading `ip ospf` (rawLine 1730)
// ---------------------------------------------------------------------------

export const ipOspfStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.ospf.status",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip ospf status")],
  parse: (exchanges) => parseOspfStatus(firstExchangeText(exchanges)),
};

export const ipOspfCfgShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.ospf.cfg.show",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip ospf cfg show")],
  parse: (exchanges) => parseOspfCfgShow(firstExchangeText(exchanges)),
};

export const ipOspfNbr: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.ospf.nbr",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip ospf nbr")],
  parse: (exchanges) => parseOspfNbr(firstExchangeText(exchanges)),
};

export const ipOspfEn: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.ospf.en",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip ospf en")],
  parse: (exchanges) => parseOspfEn(firstExchangeText(exchanges)),
};

export const ipOspfDis: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.ospf.dis",
  classification: "write",
  buildFrames: () => [frameSingleCommand("ip ospf dis")],
  parse: (exchanges) => parseOspfDis(firstExchangeText(exchanges)),
};

export type IpOspfCfgSetInput =
  | { readonly action: "state"; readonly idx: number; readonly enabled: boolean }
  | { readonly action: "area"; readonly idx: number; readonly areaId: number }
  | { readonly action: "lan"; readonly idx: number; readonly lanNumber: number }
  | { readonly action: "wan"; readonly idx: number; readonly wanNumber: number };

function assertOspfCfgIdx(idx: number): void {
  assertIntegerInRange(idx, 1, 64, "idx");
}

function buildOspfCfgSetFrames(input: IpOspfCfgSetInput): readonly CommandFrame[] {
  assertOspfCfgIdx(input.idx);

  switch (input.action) {
    case "state": {
      return [
        frameSingleCommand(
          `ip ospf cfg set ${String(input.idx)} state ${input.enabled ? "en" : "dis"}`,
        ),
      ];
    }
    case "area": {
      assertIntegerInRange(input.areaId, 1, 2_147_483_647, "areaId");

      return [
        frameSingleCommand(`ip ospf cfg set ${String(input.idx)} area ${String(input.areaId)}`),
      ];
    }
    case "lan": {
      assertIntegerInRange(input.lanNumber, 1, 20, "lanNumber");

      return [
        frameSingleCommand(`ip ospf cfg set ${String(input.idx)} lan ${String(input.lanNumber)}`),
      ];
    }
    case "wan": {
      assertIntegerInRange(input.wanNumber, 1, 2, "wanNumber");

      return [
        frameSingleCommand(`ip ospf cfg set ${String(input.idx)} wan ${String(input.wanNumber)}`),
      ];
    }
  }
}

export const ipOspfCfgSet: TypedOperation<IpOspfCfgSetInput, RawCommandOutput> = {
  manifestId: "cli.ip.ospf.cfg.set",
  classification: "write",
  buildFrames: buildOspfCfgSetFrames,
  parse: (exchanges) => parseOspfCfgSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.maxnatuser -- `ip maxnatuser <user no>` (rawLine 1781); 0 = unlimited
// ---------------------------------------------------------------------------

export interface IpMaxnatuserInput {
  readonly userCount: number;
}

function buildMaxnatuserFrames(input: IpMaxnatuserInput): readonly CommandFrame[] {
  assertInteger(input.userCount, "userCount");

  if (input.userCount < 0) {
    throw new InvalidInputError(`userCount must not be negative (got ${String(input.userCount)}).`);
  }

  return [frameSingleCommand(`ip maxnatuser ${String(input.userCount)}`)];
}

export const ipMaxnatuser: TypedOperation<IpMaxnatuserInput, RawCommandOutput> = {
  manifestId: "cli.ip.maxnatuser",
  classification: "write",
  buildFrames: buildMaxnatuserFrames,
  parse: (exchanges) => parseMaxnatuser(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.policyrt -- `ip policy_rt [-<command> <parameter>|...]` plus
// `ip policy_rt diagnose ...` (rawLine 1793). Flat args + flag allowlist,
// same precedent as `ha set` / `mngt snmp` for freely-combinable flag soups.
// ---------------------------------------------------------------------------

const POLICY_RT_FLAGS = [
  "-i",
  "-e",
  "-o",
  "-1",
  "-2",
  "-3",
  "-G",
  "-L",
  "-s",
  "-S",
  "-d",
  "-D",
  "-p",
  "-P",
  "-y",
  "-I",
  "-g",
  "-l",
  "-t",
  "-n",
  "-F",
  "-M",
  "-a",
  "-f",
  "-b",
  "-v",
] as const;

export interface IpPolicyRtInput {
  readonly args: readonly string[];
}

function buildPolicyRtFrames(input: IpPolicyRtInput): readonly CommandFrame[] {
  assertArgsShape(input.args, "ip policy_rt args");
  // `diagnose` is the documented leading keyword (rawLine 1919).
  assertKnownFlags(input.args, POLICY_RT_FLAGS, "ip policy_rt", ["diagnose"]);

  return [frameSingleCommand(`ip policy_rt ${input.args.join(" ")}`)];
}

export const ipPolicyRt: TypedOperation<IpPolicyRtInput, RawCommandOutput> = {
  manifestId: "cli.ip.policyrt",
  classification: "write",
  buildFrames: buildPolicyRtFrames,
  parse: (exchanges) => parsePolicyRt(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.landnsres -- `ip lanDNSRes` bare/query (rawLine 1938) -- read.
//
// Sibling-live-verified (`vigor3912s-mcp` `ip_lanDNSRes` frames the bare
// command). The vendor PDF also documents SET flags (`-a`/`-e`/`-i`/…) and
// a `-l` list form; this operation models only the live-observed bare query.
// ---------------------------------------------------------------------------

export const ipLanDnsRes: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.landnsres",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip lanDNSRes")],
  parse: (exchanges) => parseLanDnsRes(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.dnsforward -- `ip dnsforward` bare/query (rawLine 1990) -- read.
//
// Sibling-live-verified (`vigor3912s-mcp` `ip_dnsforward` frames the bare
// command). The vendor PDF also documents SET flags and `-l`; this operation
// models only the live-observed bare query.
// ---------------------------------------------------------------------------

export const ipDnsForward: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip.dnsforward",
  classification: "read",
  buildFrames: () => [frameSingleCommand("ip dnsforward")],
  parse: (exchanges) => parseDnsForward(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip.spoofdef -- `ip spoofdef <WAN/LAN> <0/1>` (rawLine 2030)
// ---------------------------------------------------------------------------

const SPOOFDEF_SIDES = ["WAN", "LAN"] as const;

export interface IpSpoofdefInput {
  readonly side: (typeof SPOOFDEF_SIDES)[number];
  readonly enabled: boolean;
}

function buildSpoofdefFrames(input: IpSpoofdefInput): readonly CommandFrame[] {
  assertOneOf(input.side, SPOOFDEF_SIDES, "side");

  return [frameSingleCommand(`ip spoofdef ${input.side} ${input.enabled ? "1" : "0"}`)];
}

export const ipSpoofdef: TypedOperation<IpSpoofdefInput, RawCommandOutput> = {
  manifestId: "cli.ip.spoofdef",
  classification: "write",
  buildFrames: buildSpoofdefFrames,
  parse: (exchanges) => parseSpoofdef(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// Live-firmware-recon operations (fw 4.4.7_RC2 `?` help, owner capture in
// `references/live-help-fw-4.4.7_RC2.txt`); absent from the Part VIII PDF.
// ---------------------------------------------------------------------------

export interface IpIgmpFlInput {
  readonly enabled: boolean;
}

export const ipIgmpFl = defineRawOperation<IpIgmpFlInput>(
  "cli.ip.igmpfl",
  "write",
  (input) => `ip igmp_fl ${input.enabled ? "enable" : "disable"}`,
);
export const ipIgmpFlStatus = defineCommandOperation(
  "cli.ip.igmpfl.status",
  "read",
  "ip igmp_fl status",
);

export const operations: readonly TypedOperation<never, unknown>[] = [
  ipPubsubnet,
  ipPubaddr,
  ipPubmask,
  ipLanAlias,
  ipAddr,
  ipNmask,
  ipArp,
  ipArpAdd,
  ipArpDel,
  ipArpFlush,
  ipArpAccept,
  ipArpSetCacheLife,
  ipDhcpc,
  ipPing,
  ipTracert,
  ipRip,
  ipWanrip,
  ipRoute,
  ipRouteAdd,
  ipRouteDel,
  ipRouteCnc,
  ipRouteTel,
  ipRouteDefault,
  ipRouteClean,
  ipIgmpProxyStatus,
  ipIgmpProxySet,
  ipIgmpProxyReset,
  ipIgmpProxyWan,
  ipIgmpProxyQuery,
  ipIgmpProxyPpp,
  ipIgmpProxyVersion,
  ipIgmpProxySyslog,
  ipIgmpSnoopStatus,
  ipIgmpSnoopTable,
  ipIgmpSnoopEnable,
  ipIgmpSnoopDisable,
  ipIgmpSnoopTxquery,
  ipIgmpSnoopMode,
  ipIgmpSnoopChkleave,
  ipIgmpSnoopSeparate,
  ipIgmpSnoopPortchk,
  ipIgmpSnoopAcceptlist,
  ipSession,
  ipSessionList,
  ipSessionOn,
  ipSessionOff,
  ipSessionAdd,
  ipSessionDel,
  ipSessionDefault,
  ipSessionDefaultP2p,
  ipSessionTimer,
  ipSessionBlock,
  ipSessionUnblock,
  ipBandwidth,
  ipDataflowmonitorStatus,
  ipDataflowmonitorOn,
  ipDataflowmonitorOff,
  ipBindmac,
  ipBgpShow,
  ipBgpNeighborShow,
  ipBgpStaticShow,
  ipBgp,
  ipOspfStatus,
  ipOspfCfgShow,
  ipOspfNbr,
  ipOspfEn,
  ipOspfDis,
  ipOspfCfgSet,
  ipMaxnatuser,
  ipPolicyRt,
  ipLanDnsRes,
  ipDnsForward,
  ipSpoofdef,
  ipIgmpFl,
  ipIgmpFlStatus,
];
