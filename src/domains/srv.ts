/**
 * `srv` domain -- Wave 4 Item5-srv (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements every classified `cli.srv.*` manifest entry: the previously
 * shipped DHCP/NAT set plus the remaining documented siblings
 * (`dhcp2`, `public *`, `frcdnsmanl`, `ipcnt`, `nodetype`, `primWINS`,
 * `secWINS`, `expRecycleIP`, `tftp`/`tftpdel`, `option`, `ipsecpass`,
 * `nat status`/`showall`/`pseudoctl`/`RSTTimeout`).
 *
 * Every `buildFrames` validates its input before calling
 * `frameSingleCommand` -- `frameSingleCommand` itself only rejects framing
 * hazards (control chars, shell metacharacters, empty input), it has no
 * notion of a command's own documented argument shape. Validation failures
 * throw a plain `Error` (this family's write scope excludes `src/errors.ts`,
 * so no new `SdkErrorCode` is introduced here, matching `wan.ts`'s
 * precedent).
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/srv/*.ts` (`ARCHITECTURE.md` Item 5's parser signature).
 * Compound documented syntaxes under one heading (`srv dhcp relay`,
 * `srv nat dmz`, `srv nat portmap`, `srv nat trigger`, `srv dhcp dhcp2`,
 * `srv dhcp option`, `srv nat ipsecpass`, `srv nat pseudoctl`) are modelled
 * as discriminated `action` union inputs, one canonical frame per
 * documented sub-form -- still exactly one `TypedOperation` per manifest
 * entry. Flag-heavy forms follow the documented example variants; unused
 * optional flags are deliberate YAGNI deferrals noted at the operation.
 *
 * Note: the vendor heading for expired-recycle uses `expired_RecycleIP`,
 * but the documented syntax/example is `srv dhcp expRecycleIP` -- the
 * frame follows the executable syntax.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseDns1 } from "../internal/parsers/srv/dns1.js";
import { parseDns2 } from "../internal/parsers/srv/dns2.js";
import { parseGateway } from "../internal/parsers/srv/gateway.js";
import { parseOff } from "../internal/parsers/srv/off.js";
import { parseOn } from "../internal/parsers/srv/on.js";
import { parseRelay } from "../internal/parsers/srv/relay.js";
import { parseStartip } from "../internal/parsers/srv/startip.js";
import { parseDhcpStatus, type DhcpStatusReport } from "../internal/parsers/srv/status.js";
import { parseLeasetime } from "../internal/parsers/srv/leasetime.js";
import { parseDmz } from "../internal/parsers/srv/dmz.js";
import { parseOpenport } from "../internal/parsers/srv/openport.js";
import { parsePortmap } from "../internal/parsers/srv/portmap.js";
import { parseTrigger } from "../internal/parsers/srv/trigger.js";
import { parseDhcp2 } from "../internal/parsers/srv/dhcp2.js";
import { parsePublicStatus } from "../internal/parsers/srv/public-status.js";
import { parsePublicStart } from "../internal/parsers/srv/public-start.js";
import { parsePublicCnt } from "../internal/parsers/srv/public-cnt.js";
import { parseFrcdnsmanl } from "../internal/parsers/srv/frcdnsmanl.js";
import { parseIpcnt } from "../internal/parsers/srv/ipcnt.js";
import { parseNodetype } from "../internal/parsers/srv/nodetype.js";
import { parsePrimwins } from "../internal/parsers/srv/primwins.js";
import { parseSecwins } from "../internal/parsers/srv/secwins.js";
import { parseExpiredrecycleip } from "../internal/parsers/srv/expiredrecycleip.js";
import { parseTftp } from "../internal/parsers/srv/tftp.js";
import { parseTftpdel } from "../internal/parsers/srv/tftpdel.js";
import { parseOption } from "../internal/parsers/srv/option.js";
import { parseIpsecpass } from "../internal/parsers/srv/ipsecpass.js";
import { parseNatStatus } from "../internal/parsers/srv/nat-status.js";
import { parseNatView } from "../internal/parsers/srv/nat-view.js";
import { parseShowall } from "../internal/parsers/srv/showall.js";
import { parsePseudoctl } from "../internal/parsers/srv/pseudoctl.js";
import { parseRsttimeout } from "../internal/parsers/srv/rsttimeout.js";
import type { RawCommandOutput } from "../internal/parsers/srv/shared.js";

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

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function assertIpv4(value: string, name: string): void {
  if (!IPV4_PATTERN.test(value)) {
    throw new Error(`${name} must be a valid IPv4 address (got "${value}").`);
  }
}

/**
 * Generic runtime membership check for narrow string-literal-union inputs
 * (see `wan.ts`'s identical helper for the `no-unnecessary-condition`
 * rationale).
 */
function assertOneOf<T extends string>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => `"${entry}"`).join(", ")} (got "${value}").`,
    );
  }
}

function assertNonEmptyString(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
}

/** Numeric counterpart to `assertOneOf` for narrow numeric-literal-union inputs (e.g. `0 | 1`, `1 | 2 | 3`). */
function assertNumberOneOf<T extends number>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly number[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => String(entry)).join(", ")} (got ${String(value)}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.srv.dhcp.dns1 / cli.srv.dhcp.dns2 -- `srv dhcp dns1|dns2
// <lan1/lan2/../lan100> <DNS IP address>` (rawLine 7057 / 7075)
// ---------------------------------------------------------------------------

export interface SrvDhcpDnsInput {
  readonly lan: number;
  readonly dnsIp: string;
}

function assertLan(value: number): void {
  assertIntegerInRange(value, 1, 100, "lan");
}

function buildDns1Frames(input: SrvDhcpDnsInput): readonly CommandFrame[] {
  assertLan(input.lan);
  assertIpv4(input.dnsIp, "dnsIp");

  return [frameSingleCommand(`srv dhcp dns1 lan${String(input.lan)} ${input.dnsIp}`)];
}

export const srvDhcpDns1: TypedOperation<SrvDhcpDnsInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.dns1",
  classification: "write",
  buildFrames: buildDns1Frames,
  parse: (exchanges) => parseDns1(firstExchangeText(exchanges)),
};

function buildDns2Frames(input: SrvDhcpDnsInput): readonly CommandFrame[] {
  assertLan(input.lan);
  assertIpv4(input.dnsIp, "dnsIp");

  return [frameSingleCommand(`srv dhcp dns2 lan${String(input.lan)} ${input.dnsIp}`)];
}

export const srvDhcpDns2: TypedOperation<SrvDhcpDnsInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.dns2",
  classification: "write",
  buildFrames: buildDns2Frames,
  parse: (exchanges) => parseDns2(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.gateway -- `srv dhcp gateway <Gateway IP>` (rawLine 7108)
// ---------------------------------------------------------------------------

export interface SrvDhcpGatewayInput {
  readonly gatewayIp: string;
}

function buildGatewayFrames(input: SrvDhcpGatewayInput): readonly CommandFrame[] {
  assertIpv4(input.gatewayIp, "gatewayIp");

  return [frameSingleCommand(`srv dhcp gateway ${input.gatewayIp}`)];
}

export const srvDhcpGateway: TypedOperation<SrvDhcpGatewayInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.gateway",
  classification: "write",
  buildFrames: buildGatewayFrames,
  parse: (exchanges) => parseGateway(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.off / cli.srv.dhcp.on -- `srv dhcp off` / `srv dhcp on`
// (rawLine 7134 / 7137) -- both documented as requiring `sys reboot` to take
// effect (operational note; does not change the frame itself).
// ---------------------------------------------------------------------------

function buildOffFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("srv dhcp off")];
}

export const srvDhcpOff: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.off",
  classification: "write",
  buildFrames: buildOffFrames,
  parse: (exchanges) => parseOff(firstExchangeText(exchanges)),
};

function buildOnFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("srv dhcp on")];
}

export const srvDhcpOn: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.on",
  classification: "write",
  buildFrames: buildOnFrames,
  parse: (exchanges) => parseOn(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.relay -- `srv dhcp relay servip <server ip>` /
// `srv dhcp relay 2nd_servip <server ip>` / `srv dhcp relay subnet <index>`
// (rawLine 7140)
// ---------------------------------------------------------------------------

export type SrvDhcpRelayInput =
  | { readonly action: "servip"; readonly serverIp: string }
  | { readonly action: "secondaryServip"; readonly serverIp: string }
  | { readonly action: "subnet"; readonly index: 1 | 2 };

function buildRelayFrames(input: SrvDhcpRelayInput): readonly CommandFrame[] {
  switch (input.action) {
    case "servip": {
      assertIpv4(input.serverIp, "serverIp");

      return [frameSingleCommand(`srv dhcp relay servip ${input.serverIp}`)];
    }
    case "secondaryServip": {
      assertIpv4(input.serverIp, "serverIp");

      return [frameSingleCommand(`srv dhcp relay 2nd_servip ${input.serverIp}`)];
    }
    case "subnet": {
      assertNumberOneOf<1 | 2>(input.index, [1, 2], "index");

      return [frameSingleCommand(`srv dhcp relay subnet ${String(input.index)}`)];
    }
  }
}

export const srvDhcpRelay: TypedOperation<SrvDhcpRelayInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.relay",
  classification: "write",
  buildFrames: buildRelayFrames,
  parse: (exchanges) => parseRelay(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.startip -- `srv dhcp startip <IP address>` (rawLine 7161)
// ---------------------------------------------------------------------------

export interface SrvDhcpStartipInput {
  readonly startIp: string;
}

function buildStartipFrames(input: SrvDhcpStartipInput): readonly CommandFrame[] {
  assertIpv4(input.startIp, "startIp");

  return [frameSingleCommand(`srv dhcp startip ${input.startIp}`)];
}

export const srvDhcpStartip: TypedOperation<SrvDhcpStartipInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.startip",
  classification: "write",
  buildFrames: buildStartipFrames,
  parse: (exchanges) => parseStartip(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.status -- `srv dhcp status [<LAN1/2/3/.../100/
// ip_routed_subnet>]` (rawLine 7172) -- read; the documented example itself
// runs the command with no argument.
// ---------------------------------------------------------------------------

export interface SrvDhcpStatusInput {
  readonly interfaceLabel?: string;
}

const DHCP_STATUS_INTERFACE_PATTERN = /^(lan([1-9]\d?|100)|ip_routed_subnet)$/i;

function buildDhcpStatusFrames(input: SrvDhcpStatusInput): readonly CommandFrame[] {
  if (input.interfaceLabel === undefined) {
    return [frameSingleCommand("srv dhcp status")];
  }

  if (!DHCP_STATUS_INTERFACE_PATTERN.test(input.interfaceLabel)) {
    throw new Error(
      `interfaceLabel must match "lan1".."lan100" or "ip_routed_subnet" (got "${input.interfaceLabel}").`,
    );
  }

  return [frameSingleCommand(`srv dhcp status ${input.interfaceLabel}`)];
}

export const srvDhcpStatus: TypedOperation<SrvDhcpStatusInput, DhcpStatusReport> = {
  manifestId: "cli.srv.dhcp.status",
  classification: "read",
  buildFrames: buildDhcpStatusFrames,
  parse: (exchanges) => parseDhcpStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.leasetime -- `srv dhcp leasetime <Lease Time (sec)>`
// (rawLine 7195) -- the documented syntax gives no explicit numeric bound
// beyond "the unit is second"; validated as a positive integer only, not an
// invented range.
// ---------------------------------------------------------------------------

export interface SrvDhcpLeasetimeInput {
  readonly leaseTimeSeconds: number;
}

function buildLeasetimeFrames(input: SrvDhcpLeasetimeInput): readonly CommandFrame[] {
  assertPositiveInteger(input.leaseTimeSeconds, "leaseTimeSeconds");

  return [frameSingleCommand(`srv dhcp leasetime ${String(input.leaseTimeSeconds)}`)];
}

export const srvDhcpLeasetime: TypedOperation<SrvDhcpLeasetimeInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.leasetime",
  classification: "write",
  buildFrames: buildLeasetimeFrames,
  parse: (exchanges) => parseLeasetime(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.nat.dmz -- `srv nat dmz <n> <m> [-e <0/1>|-i <ip>|-r|-v]`
// (rawLine 7347); `n`: 1=wan1, 2=wan2; `m`: DMZ host index 1-300.
// ---------------------------------------------------------------------------

export type SrvNatDmzInput =
  | {
      readonly action: "setPrivateIp";
      readonly wan: 1 | 2;
      readonly index: number;
      readonly privateIp: string;
    }
  | {
      readonly action: "toggle";
      readonly wan: 1 | 2;
      readonly index: number;
      readonly enabled: boolean;
    }
  | { readonly action: "remove"; readonly wan: 1 | 2; readonly index: number }
  | { readonly action: "view" };

function assertDmzWan(value: 1 | 2): void {
  assertNumberOneOf<1 | 2>(value, [1, 2], "wan");
}

function assertDmzIndex(value: number): void {
  assertIntegerInRange(value, 1, 300, "index");
}

function buildDmzFrames(input: SrvNatDmzInput): readonly CommandFrame[] {
  if (input.action === "view") {
    return [frameSingleCommand("srv nat dmz -v")];
  }

  assertDmzWan(input.wan);
  assertDmzIndex(input.index);

  const prefix = `srv nat dmz ${String(input.wan)} ${String(input.index)}`;

  switch (input.action) {
    case "setPrivateIp": {
      assertIpv4(input.privateIp, "privateIp");

      return [frameSingleCommand(`${prefix} -i ${input.privateIp}`)];
    }
    case "toggle": {
      return [frameSingleCommand(`${prefix} -e ${input.enabled ? "1" : "0"}`)];
    }
    case "remove": {
      return [frameSingleCommand(`${prefix} -r`)];
    }
  }
}

export const srvNatDmz: TypedOperation<SrvNatDmzInput, RawCommandOutput> = {
  manifestId: "cli.srv.nat.dmz",
  classification: "write",
  buildFrames: buildDmzFrames,
  parse: (exchanges) => parseDmz(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.nat.openport -- `srv nat openport <n> <m> -a <0/1> -c <comment>
// -i <local ip> -w <widx> <ipidx> -p <TCP/UDP/ALL> -s <start> -e <end>`
// (rawLine 7410) -- canonical add/update variant documented by the heading's
// own worked example; `-l`/`-g` (source IP object/group), `-v` (view), `-r`
// (delete), `-f` (factory reset) sub-forms are a deliberate YAGNI deferral,
// same pattern as `wan.ts`'s narrowed multi-variant headings.
// ---------------------------------------------------------------------------

export interface SrvNatOpenportInput {
  readonly ruleIndex: number;
  readonly subItem: number;
  readonly enabled: boolean;
  readonly comment: string;
  readonly localIp: string;
  readonly wanIndex: number;
  readonly wanAliasIndex: number;
  readonly protocol: "TCP" | "UDP" | "ALL";
  readonly startPort: number;
  readonly endPort: number;
}

function buildOpenportFrames(input: SrvNatOpenportInput): readonly CommandFrame[] {
  assertIntegerInRange(input.ruleIndex, 1, 260, "ruleIndex");
  assertIntegerInRange(input.subItem, 1, 10, "subItem");
  assertNonEmptyString(input.comment, "comment");

  if (input.comment.length >= 23) {
    throw new Error(
      `comment must be less than 23 characters (got ${String(input.comment.length)}).`,
    );
  }

  assertIpv4(input.localIp, "localIp");
  assertPositiveInteger(input.wanIndex, "wanIndex");
  assertIntegerInRange(input.wanAliasIndex, 1, 32, "wanAliasIndex");
  assertOneOf(input.protocol, ["TCP", "UDP", "ALL"], "protocol");
  assertIntegerInRange(input.startPort, 0, 65535, "startPort");
  assertIntegerInRange(input.endPort, 0, 65535, "endPort");

  return [
    frameSingleCommand(
      `srv nat openport ${String(input.ruleIndex)} ${String(input.subItem)} -a ${input.enabled ? "1" : "0"} -c ${input.comment} -i ${input.localIp} -w ${String(input.wanIndex)} ${String(input.wanAliasIndex)} -p ${input.protocol} -s ${String(input.startPort)} -e ${String(input.endPort)}`,
    ),
  ];
}

export const srvNatOpenport: TypedOperation<SrvNatOpenportInput, RawCommandOutput> = {
  manifestId: "cli.srv.nat.openport",
  classification: "write",
  buildFrames: buildOpenportFrames,
  parse: (exchanges) => parseOpenport(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.nat.portmap -- `srv nat portmap add|del|disable|enable|flush|
// table|view ...` (rawLine 7474)
// ---------------------------------------------------------------------------

export type SrvNatPortmapInput =
  | {
      readonly action: "add";
      readonly index: number;
      readonly serviceName: string;
      readonly protocol: "TCP" | "UDP";
      readonly publicPort: number;
      readonly sourceIpType: 0 | 1;
      readonly sourceIpIndex: number;
      readonly privateIp: string;
      readonly privatePort: number;
      readonly wanIndex: string;
      readonly aliasIpIndex: number;
    }
  | { readonly action: "delete"; readonly index: number }
  | { readonly action: "disable"; readonly index: number }
  | { readonly action: "enable"; readonly index: number; readonly protocol: "TCP" | "UDP" }
  | { readonly action: "flush" }
  | { readonly action: "table" }
  | { readonly action: "view" };

const PORTMAP_WAN_INDEX_PATTERN = /^(wan(1[0-2]|[1-9])|all)$/;

function assertPortmapIndex(value: number): void {
  assertIntegerInRange(value, 1, 260, "index");
}

function buildPortmapFrames(input: SrvNatPortmapInput): readonly CommandFrame[] {
  switch (input.action) {
    case "add": {
      assertPortmapIndex(input.index);
      assertNonEmptyString(input.serviceName, "serviceName");
      assertOneOf(input.protocol, ["TCP", "UDP"], "protocol");
      assertIntegerInRange(input.publicPort, 0, 65535, "publicPort");
      assertNumberOneOf<0 | 1>(input.sourceIpType, [0, 1], "sourceIpType");
      assertIntegerInRange(input.sourceIpIndex, 0, 192, "sourceIpIndex");
      assertIpv4(input.privateIp, "privateIp");
      assertIntegerInRange(input.privatePort, 1, 65535, "privatePort");

      if (!PORTMAP_WAN_INDEX_PATTERN.test(input.wanIndex)) {
        throw new Error(`wanIndex must match "wan1".."wan12" or "all" (got "${input.wanIndex}").`);
      }

      assertIntegerInRange(input.aliasIpIndex, 1, 32, "aliasIpIndex");

      return [
        frameSingleCommand(
          `srv nat portmap add ${String(input.index)} ${input.serviceName} ${input.protocol.toLowerCase()} ${String(input.publicPort)} ${String(input.sourceIpType)} ${String(input.sourceIpIndex)} ${input.privateIp} ${String(input.privatePort)} ${input.wanIndex} ${String(input.aliasIpIndex)}`,
        ),
      ];
    }
    case "delete": {
      assertPortmapIndex(input.index);

      return [frameSingleCommand(`srv nat portmap del ${String(input.index)}`)];
    }
    case "disable": {
      assertPortmapIndex(input.index);

      return [frameSingleCommand(`srv nat portmap disable ${String(input.index)}`)];
    }
    case "enable": {
      assertPortmapIndex(input.index);
      assertOneOf(input.protocol, ["TCP", "UDP"], "protocol");

      return [
        frameSingleCommand(
          `srv nat portmap enable ${String(input.index)} ${input.protocol.toLowerCase()}`,
        ),
      ];
    }
    case "flush": {
      return [frameSingleCommand("srv nat portmap flush")];
    }
    case "table": {
      return [frameSingleCommand("srv nat portmap table")];
    }
    case "view": {
      return [frameSingleCommand("srv nat portmap view")];
    }
  }
}

export const srvNatPortmap: TypedOperation<SrvNatPortmapInput, RawCommandOutput> = {
  manifestId: "cli.srv.nat.portmap",
  classification: "write",
  buildFrames: buildPortmapFrames,
  parse: (exchanges) => parsePortmap(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.nat.trigger -- `srv nat trigger setdefault` / `srv nat trigger
// view` / `srv nat trigger <n> -<command> <parameter>` (rawLine 7535) --
// modelled as one canonical single-flag frame per documented sub-form
// (same pattern as `wan.ts`'s `wan vlan`); combining multiple flags in one
// line (the heading's own "[...] means you can type several commands in one
// line" note) is a deliberate YAGNI deferral.
// ---------------------------------------------------------------------------

export type SrvNatTriggerInput =
  | { readonly action: "setDefault" }
  | { readonly action: "view" }
  | { readonly action: "comment"; readonly rule: number; readonly comment: string }
  | { readonly action: "enable"; readonly rule: number; readonly enabled: boolean }
  | { readonly action: "sourceIpType"; readonly rule: number; readonly ipType: 0 | 1 }
  | { readonly action: "protocol"; readonly rule: number; readonly protocol: 1 | 2 | 3 }
  | { readonly action: "triggerPort"; readonly rule: number; readonly port: number }
  | { readonly action: "incomingProtocol"; readonly rule: number; readonly protocol: 1 | 2 | 3 }
  | { readonly action: "incomingPort"; readonly rule: number; readonly port: number }
  | { readonly action: "delete"; readonly rule: number }
  | { readonly action: "viewRule"; readonly rule: number };

function assertTriggerProtocol(value: 1 | 2 | 3, name: string): void {
  assertNumberOneOf<1 | 2 | 3>(value, [1, 2, 3], name);
}

function buildTriggerFrames(input: SrvNatTriggerInput): readonly CommandFrame[] {
  if (input.action === "setDefault") {
    return [frameSingleCommand("srv nat trigger setdefault")];
  }

  if (input.action === "view") {
    return [frameSingleCommand("srv nat trigger view")];
  }

  assertPositiveInteger(input.rule, "rule");

  const prefix = `srv nat trigger ${String(input.rule)}`;

  switch (input.action) {
    case "comment": {
      assertNonEmptyString(input.comment, "comment");

      return [frameSingleCommand(`${prefix} -c ${input.comment}`)];
    }
    case "enable": {
      return [frameSingleCommand(`${prefix} -e ${input.enabled ? "1" : "0"}`)];
    }
    case "sourceIpType": {
      assertNumberOneOf<0 | 1>(input.ipType, [0, 1], "ipType");

      return [frameSingleCommand(`${prefix} -g${String(input.ipType)}`)];
    }
    case "protocol": {
      assertTriggerProtocol(input.protocol, "protocol");

      return [frameSingleCommand(`${prefix} -p ${String(input.protocol)}`)];
    }
    case "triggerPort": {
      assertIntegerInRange(input.port, 0, 65535, "port");

      return [frameSingleCommand(`${prefix} -t ${String(input.port)}`)];
    }
    case "incomingProtocol": {
      assertTriggerProtocol(input.protocol, "protocol");

      return [frameSingleCommand(`${prefix} -P ${String(input.protocol)}`)];
    }
    case "incomingPort": {
      assertIntegerInRange(input.port, 0, 65535, "port");

      return [frameSingleCommand(`${prefix} -i ${String(input.port)}`)];
    }
    case "delete": {
      return [frameSingleCommand(`${prefix} -d`)];
    }
    case "viewRule": {
      return [frameSingleCommand(`${prefix} -v`)];
    }
  }
}

export const srvNatTrigger: TypedOperation<SrvNatTriggerInput, RawCommandOutput> = {
  manifestId: "cli.srv.nat.trigger",
  classification: "write",
  buildFrames: buildTriggerFrames,
  parse: (exchanges) => parseTrigger(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.dhcp2 -- `srv dhcp dhcp2 [-l|-m|-e|-d|-v ...]` (rawLine 6988)
// ---------------------------------------------------------------------------

export type SrvDhcpDhcp2Input =
  | { readonly action: "lanAssign"; readonly enabled: boolean }
  | { readonly action: "macAssign"; readonly enabled: boolean }
  | { readonly action: "enablePort"; readonly portId: 3 | 4 }
  | { readonly action: "disablePort"; readonly portId: 3 | 4 }
  | { readonly action: "view" };

function buildDhcp2Frames(input: SrvDhcpDhcp2Input): readonly CommandFrame[] {
  switch (input.action) {
    case "lanAssign": {
      return [frameSingleCommand(`srv dhcp dhcp2 -l ${input.enabled ? "1" : "0"}`)];
    }
    case "macAssign": {
      return [frameSingleCommand(`srv dhcp dhcp2 -m ${input.enabled ? "1" : "0"}`)];
    }
    case "enablePort": {
      assertNumberOneOf<3 | 4>(input.portId, [3, 4], "portId");

      return [frameSingleCommand(`srv dhcp dhcp2 -e ${String(input.portId)}`)];
    }
    case "disablePort": {
      assertNumberOneOf<3 | 4>(input.portId, [3, 4], "portId");

      return [frameSingleCommand(`srv dhcp dhcp2 -d ${String(input.portId)}`)];
    }
    case "view": {
      return [frameSingleCommand("srv dhcp dhcp2 -v")];
    }
  }
}

export const srvDhcpDhcp2: TypedOperation<SrvDhcpDhcp2Input, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.dhcp2",
  classification: "write",
  buildFrames: buildDhcp2Frames,
  parse: (exchanges) => parseDhcp2(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.public.* (rawLine 7023)
// ---------------------------------------------------------------------------

function buildPublicStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("srv dhcp public status")];
}

export const srvDhcpPublicStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.public.status",
  classification: "read",
  buildFrames: buildPublicStatusFrames,
  parse: (exchanges) => parsePublicStatus(firstExchangeText(exchanges)),
};

export interface SrvDhcpPublicStartInput {
  readonly startIp: string;
}

function buildPublicStartFrames(input: SrvDhcpPublicStartInput): readonly CommandFrame[] {
  assertIpv4(input.startIp, "startIp");

  return [frameSingleCommand(`srv dhcp public start ${input.startIp}`)];
}

export const srvDhcpPublicStart: TypedOperation<SrvDhcpPublicStartInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.public.start",
  classification: "write",
  buildFrames: buildPublicStartFrames,
  parse: (exchanges) => parsePublicStart(firstExchangeText(exchanges)),
};

export interface SrvDhcpPublicCntInput {
  /** Documented maximum pool size is 10. */
  readonly count: number;
}

function buildPublicCntFrames(input: SrvDhcpPublicCntInput): readonly CommandFrame[] {
  assertIntegerInRange(input.count, 1, 10, "count");

  return [frameSingleCommand(`srv dhcp public cnt ${String(input.count)}`)];
}

export const srvDhcpPublicCnt: TypedOperation<SrvDhcpPublicCntInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.public.cnt",
  classification: "write",
  buildFrames: buildPublicCntFrames,
  parse: (exchanges) => parsePublicCnt(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.frcdnsmanl -- `srv dhcp frcdnsmanl on|off` (rawLine 7094)
// ---------------------------------------------------------------------------

export interface SrvDhcpFrcdnsmanlInput {
  readonly enabled: boolean;
}

function buildFrcdnsmanlFrames(input: SrvDhcpFrcdnsmanlInput): readonly CommandFrame[] {
  return [frameSingleCommand(`srv dhcp frcdnsmanl ${input.enabled ? "on" : "off"}`)];
}

export const srvDhcpFrcdnsmanl: TypedOperation<SrvDhcpFrcdnsmanlInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.frcdnsmanl",
  classification: "write",
  buildFrames: buildFrcdnsmanlFrames,
  parse: (exchanges) => parseFrcdnsmanl(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.ipcnt -- `srv dhcp ipcnt <IP counts>` (rawLine 7122)
// ---------------------------------------------------------------------------

export interface SrvDhcpIpcntInput {
  /** Documented range: 0..256. */
  readonly count: number;
}

function buildIpcntFrames(input: SrvDhcpIpcntInput): readonly CommandFrame[] {
  assertIntegerInRange(input.count, 0, 256, "count");

  return [frameSingleCommand(`srv dhcp ipcnt ${String(input.count)}`)];
}

export const srvDhcpIpcnt: TypedOperation<SrvDhcpIpcntInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.ipcnt",
  classification: "write",
  buildFrames: buildIpcntFrames,
  parse: (exchanges) => parseIpcnt(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.nodetype -- `srv dhcp nodetype <1|2|4|8>` (rawLine 7208)
// ---------------------------------------------------------------------------

export interface SrvDhcpNodetypeInput {
  readonly nodeType: 1 | 2 | 4 | 8;
}

function buildNodetypeFrames(input: SrvDhcpNodetypeInput): readonly CommandFrame[] {
  assertNumberOneOf<1 | 2 | 4 | 8>(input.nodeType, [1, 2, 4, 8], "nodeType");

  return [frameSingleCommand(`srv dhcp nodetype ${String(input.nodeType)}`)];
}

export const srvDhcpNodetype: TypedOperation<SrvDhcpNodetypeInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.nodetype",
  classification: "write",
  buildFrames: buildNodetypeFrames,
  parse: (exchanges) => parseNodetype(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.primwins / secwins (rawLine 7228 / 7243)
// ---------------------------------------------------------------------------

export type SrvDhcpWinsInput =
  { readonly action: "set"; readonly winsIp: string } | { readonly action: "clear" };

function buildPrimWinsFrames(input: SrvDhcpWinsInput): readonly CommandFrame[] {
  if (input.action === "clear") {
    return [frameSingleCommand("srv dhcp primWINS clear")];
  }

  assertIpv4(input.winsIp, "winsIp");

  return [frameSingleCommand(`srv dhcp primWINS ${input.winsIp}`)];
}

export const srvDhcpPrimWins: TypedOperation<SrvDhcpWinsInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.primwins",
  classification: "write",
  buildFrames: buildPrimWinsFrames,
  parse: (exchanges) => parsePrimwins(firstExchangeText(exchanges)),
};

function buildSecWinsFrames(input: SrvDhcpWinsInput): readonly CommandFrame[] {
  if (input.action === "clear") {
    return [frameSingleCommand("srv dhcp secWINS clear")];
  }

  assertIpv4(input.winsIp, "winsIp");

  return [frameSingleCommand(`srv dhcp secWINS ${input.winsIp}`)];
}

export const srvDhcpSecWins: TypedOperation<SrvDhcpWinsInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.secwins",
  classification: "write",
  buildFrames: buildSecWinsFrames,
  parse: (exchanges) => parseSecwins(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.expiredrecycleip -- syntax `srv dhcp expRecycleIP` (rawLine 7261)
// ---------------------------------------------------------------------------

export interface SrvDhcpExpiredRecycleIpInput {
  /** Documented range: 5..300 seconds. */
  readonly seconds: number;
}

function buildExpiredRecycleIpFrames(input: SrvDhcpExpiredRecycleIpInput): readonly CommandFrame[] {
  assertIntegerInRange(input.seconds, 5, 300, "seconds");

  return [frameSingleCommand(`srv dhcp expRecycleIP ${String(input.seconds)}`)];
}

export const srvDhcpExpiredRecycleIp: TypedOperation<
  SrvDhcpExpiredRecycleIpInput,
  RawCommandOutput
> = {
  manifestId: "cli.srv.dhcp.expiredrecycleip",
  classification: "write",
  buildFrames: buildExpiredRecycleIpFrames,
  parse: (exchanges) => parseExpiredrecycleip(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.tftp / tftpdel (rawLine 7273 / 7285)
// ---------------------------------------------------------------------------

export interface SrvDhcpTftpInput {
  readonly serverName: string;
}

function buildTftpFrames(input: SrvDhcpTftpInput): readonly CommandFrame[] {
  assertNonEmptyString(input.serverName, "serverName");

  return [frameSingleCommand(`srv dhcp tftp ${input.serverName}`)];
}

export const srvDhcpTftp: TypedOperation<SrvDhcpTftpInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.tftp",
  classification: "write",
  buildFrames: buildTftpFrames,
  parse: (exchanges) => parseTftp(firstExchangeText(exchanges)),
};

function buildTftpdelFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("srv dhcp tftpdel")];
}

export const srvDhcpTftpdel: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.tftpdel",
  classification: "write",
  buildFrames: buildTftpdelFrames,
  parse: (exchanges) => parseTftpdel(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.dhcp.option -- documented example variants (rawLine 7300)
// ---------------------------------------------------------------------------

export type SrvDhcpOptionInput =
  | { readonly action: "list" }
  | { readonly action: "delete"; readonly index: number }
  | {
      readonly action: "setAscii";
      readonly enabled: boolean;
      readonly lan: string;
      readonly optionNumber: number;
      readonly value: string;
    }
  | {
      readonly action: "setHex";
      readonly enabled: boolean;
      readonly lan: string;
      readonly optionNumber: number;
      readonly value: string;
    }
  | {
      readonly action: "setIp";
      readonly enabled: boolean;
      readonly lan: string;
      readonly optionNumber: number;
      readonly value: string;
    }
  | {
      readonly action: "setNextServer";
      readonly enabled: boolean;
      readonly lan: string;
      readonly nextServerIp: string;
    }
  | { readonly action: "update"; readonly index: number };

const DHCP_OPTION_LAN_PATTERN = /^([1-9]\d?|100|a|r)$/i;

function assertDhcpOptionLan(value: string): void {
  if (!DHCP_OPTION_LAN_PATTERN.test(value)) {
    throw new Error(
      `lan must match "1".."100", "a" (all LAN), or "r" (routed subnet) (got "${value}").`,
    );
  }
}

function buildOptionFrames(input: SrvDhcpOptionInput): readonly CommandFrame[] {
  switch (input.action) {
    case "list": {
      return [frameSingleCommand("srv dhcp option -l")];
    }
    case "delete": {
      assertPositiveInteger(input.index, "index");

      return [frameSingleCommand(`srv dhcp option -d ${String(input.index)}`)];
    }
    case "setAscii": {
      assertDhcpOptionLan(input.lan);
      assertIntegerInRange(input.optionNumber, 0, 255, "optionNumber");
      assertNonEmptyString(input.value, "value");

      return [
        frameSingleCommand(
          `srv dhcp option -e ${input.enabled ? "1" : "0"} -i ${input.lan} -c ${String(input.optionNumber)} -v ${input.value}`,
        ),
      ];
    }
    case "setHex": {
      assertDhcpOptionLan(input.lan);
      assertIntegerInRange(input.optionNumber, 0, 255, "optionNumber");
      assertNonEmptyString(input.value, "value");

      return [
        frameSingleCommand(
          `srv dhcp option -e ${input.enabled ? "1" : "0"} -i ${input.lan} -c ${String(input.optionNumber)} -x ${input.value}`,
        ),
      ];
    }
    case "setIp": {
      assertDhcpOptionLan(input.lan);
      assertIntegerInRange(input.optionNumber, 0, 255, "optionNumber");
      assertIpv4(input.value, "value");

      return [
        frameSingleCommand(
          `srv dhcp option -e ${input.enabled ? "1" : "0"} -i ${input.lan} -c ${String(input.optionNumber)} -a ${input.value}`,
        ),
      ];
    }
    case "setNextServer": {
      assertDhcpOptionLan(input.lan);
      assertIpv4(input.nextServerIp, "nextServerIp");

      return [
        frameSingleCommand(
          `srv dhcp option -e ${input.enabled ? "1" : "0"} -i ${input.lan} -s ${input.nextServerIp}`,
        ),
      ];
    }
    case "update": {
      assertPositiveInteger(input.index, "index");

      return [frameSingleCommand(`srv dhcp option -u ${String(input.index)}`)];
    }
  }
}

export const srvDhcpOption: TypedOperation<SrvDhcpOptionInput, RawCommandOutput> = {
  manifestId: "cli.srv.dhcp.option",
  classification: "write",
  buildFrames: buildOptionFrames,
  parse: (exchanges) => parseOption(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.nat.ipsecpass -- `on|off|status` (rawLine 7390)
// ---------------------------------------------------------------------------

export type SrvNatIpsecpassInput =
  { readonly action: "on" } | { readonly action: "off" } | { readonly action: "status" };

function buildIpsecpassFrames(input: SrvNatIpsecpassInput): readonly CommandFrame[] {
  switch (input.action) {
    case "on": {
      return [frameSingleCommand("srv nat ipsecpass on")];
    }
    case "off": {
      return [frameSingleCommand("srv nat ipsecpass off")];
    }
    case "status": {
      return [frameSingleCommand("srv nat ipsecpass status")];
    }
  }
}

export const srvNatIpsecpass: TypedOperation<SrvNatIpsecpassInput, RawCommandOutput> = {
  manifestId: "cli.srv.nat.ipsecpass",
  classification: "write",
  buildFrames: buildIpsecpassFrames,
  parse: (exchanges) => parseIpsecpass(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.nat.status / showall (rawLine 7588 / 7619) -- read
// ---------------------------------------------------------------------------

function buildNatStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("srv nat status")];
}

export const srvNatStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.srv.nat.status",
  classification: "read",
  buildFrames: buildNatStatusFrames,
  parse: (exchanges) => parseNatStatus(firstExchangeText(exchanges)),
};

function buildShowallFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("srv nat showall")];
}

export const srvNatShowall: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.srv.nat.showall",
  classification: "read",
  buildFrames: buildShowallFrames,
  parse: (exchanges) => parseShowall(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.nat.pseudoctl (rawLine 7646)
// ---------------------------------------------------------------------------

export type SrvNatPseudoctlInput =
  | { readonly action: "session"; readonly threshold: number }
  | { readonly action: "function"; readonly mode: 0 | 1 | 2 | 3 };

function buildPseudoctlFrames(input: SrvNatPseudoctlInput): readonly CommandFrame[] {
  switch (input.action) {
    case "session": {
      assertIntegerInRange(input.threshold, 0, 2_147_483_647, "threshold");

      return [frameSingleCommand(`srv nat pseudoctl session ${String(input.threshold)}`)];
    }
    case "function": {
      assertNumberOneOf<0 | 1 | 2 | 3>(input.mode, [0, 1, 2, 3], "mode");

      return [frameSingleCommand(`srv nat pseudoctl function ${String(input.mode)}`)];
    }
  }
}

export const srvNatPseudoctl: TypedOperation<SrvNatPseudoctlInput, RawCommandOutput> = {
  manifestId: "cli.srv.nat.pseudoctl",
  classification: "write",
  buildFrames: buildPseudoctlFrames,
  parse: (exchanges) => parsePseudoctl(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.nat.rsttimeout -- `srv nat RSTTimeout <0..10>` (rawLine 7668)
// ---------------------------------------------------------------------------

export interface SrvNatRstTimeoutInput {
  /** Documented range: 0..10 (unit = 10 msec). */
  readonly value: number;
}

function buildRstTimeoutFrames(input: SrvNatRstTimeoutInput): readonly CommandFrame[] {
  assertIntegerInRange(input.value, 0, 10, "value");

  return [frameSingleCommand(`srv nat RSTTimeout ${String(input.value)}`)];
}

export const srvNatRstTimeout: TypedOperation<SrvNatRstTimeoutInput, RawCommandOutput> = {
  manifestId: "cli.srv.nat.rsttimeout",
  classification: "write",
  buildFrames: buildRstTimeoutFrames,
  parse: (exchanges) => parseRsttimeout(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.srv.nat.view -- `srv nat view` (live-firmware-recon) -- bare read
// ---------------------------------------------------------------------------

function buildNatViewFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("srv nat view")];
}

export const srvNatView: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.srv.nat.view",
  classification: "read",
  buildFrames: buildNatViewFrames,
  parse: (exchanges) => parseNatView(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  srvDhcpDns1,
  srvDhcpDns2,
  srvDhcpGateway,
  srvDhcpOff,
  srvDhcpOn,
  srvDhcpRelay,
  srvDhcpStartip,
  srvDhcpStatus,
  srvDhcpLeasetime,
  srvNatDmz,
  srvNatOpenport,
  srvNatPortmap,
  srvNatTrigger,
  srvDhcpDhcp2,
  srvDhcpPublicStatus,
  srvDhcpPublicStart,
  srvDhcpPublicCnt,
  srvDhcpFrcdnsmanl,
  srvDhcpIpcnt,
  srvDhcpNodetype,
  srvDhcpPrimWins,
  srvDhcpSecWins,
  srvDhcpExpiredRecycleIp,
  srvDhcpTftp,
  srvDhcpTftpdel,
  srvDhcpOption,
  srvNatIpsecpass,
  srvNatStatus,
  srvNatShowall,
  srvNatPseudoctl,
  srvNatRstTimeout,
  srvNatView,
];
