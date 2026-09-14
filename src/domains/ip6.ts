/**
 * `ip6` domain -- Wave 4 Item5-ip6 (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements every classified `cli.ip6.*` manifest entry: the previously
 * shipped `ping`/`tracert`/`addr`/`mngt` set plus the remaining documented
 * siblings (`dhcp *`, `internet`, `neigh -a/-s/-d`, `pneigh`, `route`,
 * `tspc`, `radvd`, `online`, `aiccu`, `ntp -v/-p`, `lan`, `session`,
 * `bandwidth`).
 *
 * `ip6 ping` / `ip6 tracert` are active network probes and therefore carry
 * the `ARCHITECTURE.md` Item 3 diagnostic exception -- the same
 * `executionOverride: { commandTimeoutMs: 60_000 }` ceiling the IPv4
 * `ip ping` / `ip tracert` pair is documented to need (`ARCH#Item-3`,
 * "Resolved decisions log"): a hard-coded registry-defined ceiling, never a
 * caller-supplied `timeoutMs` (that only ever lowers, never raises, the raw
 * wrapper's 15s default -- see `internal/execution/limits.ts`).
 *
 * Every `buildFrames` validates its input before calling
 * `frameSingleCommand` -- `frameSingleCommand` itself only rejects framing
 * hazards (control chars, shell metacharacters, empty input), it has no
 * notion of a command's own documented argument shape. Validation failures
 * throw a plain `Error` (this family's write scope excludes `src/errors.ts`,
 * so no new `SdkErrorCode` is introduced here, matching the `wan` family's
 * precedent).
 *
 * Flag-heavy headings (`dhcp req_opt`/`client`/`server`, `internet`,
 * `radvd`, `lan`) follow the documented example variants as discriminated
 * unions; unused optional flags are deliberate YAGNI deferrals noted at
 * each operation.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseAddr } from "../internal/parsers/ip6/addr.js";
import { parseMngt } from "../internal/parsers/ip6/mngt.js";
import { parsePing } from "../internal/parsers/ip6/ping.js";
import { parseTracert } from "../internal/parsers/ip6/tracert.js";
import { parseDhcpReqopt } from "../internal/parsers/ip6/dhcp-reqopt.js";
import { parseDhcpClient } from "../internal/parsers/ip6/dhcp-client.js";
import { parseDhcpServer } from "../internal/parsers/ip6/dhcp-server.js";
import { parseDhcpOptionc } from "../internal/parsers/ip6/dhcp-optionc.js";
import { parseDhcpOptions } from "../internal/parsers/ip6/dhcp-options.js";
import { parseInternet } from "../internal/parsers/ip6/internet.js";
import { parseNeighA } from "../internal/parsers/ip6/neigh-a.js";
import { parseNeighS } from "../internal/parsers/ip6/neigh-s.js";
import { parseNeighD } from "../internal/parsers/ip6/neigh-d.js";
import { parsePneigh } from "../internal/parsers/ip6/pneigh.js";
import { parseRoute } from "../internal/parsers/ip6/route.js";
import { parseTspc } from "../internal/parsers/ip6/tspc.js";
import { parseRadvd } from "../internal/parsers/ip6/radvd.js";
import { parseOnline } from "../internal/parsers/ip6/online.js";
import { parseAiccu } from "../internal/parsers/ip6/aiccu.js";
import { parseNtpV } from "../internal/parsers/ip6/ntp-v.js";
import { parseNtpP } from "../internal/parsers/ip6/ntp-p.js";
import { parseLan } from "../internal/parsers/ip6/lan.js";
import { parseSession } from "../internal/parsers/ip6/session.js";
import { parseBandwidth } from "../internal/parsers/ip6/bandwidth.js";
import type { RawCommandOutput } from "../internal/parsers/ip6/shared.js";

/**
 * `ARCH#Item-3`'s diagnostic exception, hard-coded per operation -- never
 * exposed as a caller-raisable option.
 */
const DIAGNOSTIC_TIMEOUT_OVERRIDE = { commandTimeoutMs: 60_000 } as const;

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

/**
 * Documented interface labels shared by both `ip6 ping` and `ip6 tracert`
 * (`LAN1|LAN2|...|LAN100|WAN1|...|WAN10`).
 */
const INTERFACE_LABEL_PATTERN = /^(LAN([1-9][0-9]?|100)|WAN([1-9]|10))$/;

function assertInterfaceLabel(value: string, name: string): void {
  if (!INTERFACE_LABEL_PATTERN.test(value)) {
    throw new Error(`${name} must match "LAN1".."LAN100" or "WAN1".."WAN10" (got "${value}").`);
  }
}

/**
 * `ip6 addr -s`/`-d` also accept `VPN1`..`VPN500` (rawLine 2060).
 */
function assertAddrInterface(value: string, name: string, allowVpn: boolean): void {
  if (INTERFACE_LABEL_PATTERN.test(value)) {
    return;
  }

  if (allowVpn) {
    const match = /^VPN(\d+)$/.exec(value);

    if (match !== null) {
      const vpnNumber = Number(match[1]);

      if (vpnNumber >= 1 && vpnNumber <= 500) {
        return;
      }
    }
  }

  const vpnHint = allowVpn ? ', or "VPN1".."VPN500"' : "";

  throw new Error(
    `${name} must match "LAN1".."LAN100" or "WAN1".."WAN10"${vpnHint} (got "${value}").`,
  );
}

/**
 * Deliberately conservative IPv6-shape validator (no embedded-IPv4 support,
 * no zone-id suffix -- YAGNI unless a real need appears): accepts full,
 * `::`-compressed, and `::`-only forms; rejects a bare IPv4 address (no
 * colons at all) and malformed syntax such as more than one `::` compression.
 */
const IPV6_PATTERN =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

function assertIpv6(value: string, name: string): void {
  if (!IPV6_PATTERN.test(value)) {
    throw new Error(`${name} must be a valid IPv6 address (got "${value}").`);
  }
}

function assertIntegerInRange(value: number, min: number, max: number, name: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(
      `${name} must be an integer between ${String(min)} and ${String(max)} (got ${String(value)}).`,
    );
  }
}

function assertOneOf<T extends string>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => `"${entry}"`).join(", ")} (got "${value}").`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.ip6.ping -- `ip6 ping <IPV6 address/Host> <LAN1|...|WAN10> <send count>
// <data_size>` (rawLine 2692) -- read
// ---------------------------------------------------------------------------

export interface Ip6PingInput {
  readonly target: string;
  /** Optional `LAN1`..`LAN100` / `WAN1`..`WAN10` interface label. */
  readonly interfaceLabel?: string;
  /** Optional packet count; requires `interfaceLabel` and `dataSize` (documented as an adjacent argument triple). */
  readonly sendCount?: number;
  /** Optional per-packet data size, 1 to 1452 bytes (documented range); requires `interfaceLabel` and `sendCount`. */
  readonly dataSize?: number;
}

function buildPingFrames(input: Ip6PingInput): readonly CommandFrame[] {
  assertIpv6(input.target, "target");

  const parts = [input.target];

  if (input.interfaceLabel !== undefined) {
    assertInterfaceLabel(input.interfaceLabel, "interfaceLabel");
    parts.push(input.interfaceLabel);

    if (input.sendCount !== undefined || input.dataSize !== undefined) {
      if (input.sendCount === undefined || input.dataSize === undefined) {
        throw new Error("sendCount and dataSize must both be provided together, or neither.");
      }

      assertIntegerInRange(input.sendCount, 1, 100, "sendCount");
      assertIntegerInRange(input.dataSize, 1, 1452, "dataSize");
      parts.push(String(input.sendCount), String(input.dataSize));
    }
  } else if (input.sendCount !== undefined || input.dataSize !== undefined) {
    throw new Error("sendCount/dataSize require interfaceLabel to also be provided.");
  }

  return [frameSingleCommand(`ip6 ping ${parts.join(" ")}`)];
}

export const ip6Ping: TypedOperation<Ip6PingInput, RawCommandOutput> = {
  manifestId: "cli.ip6.ping",
  classification: "read",
  buildFrames: buildPingFrames,
  parse: (exchanges) => parsePing(firstExchangeText(exchanges)),
  executionOverride: DIAGNOSTIC_TIMEOUT_OVERRIDE,
};

// ---------------------------------------------------------------------------
// cli.ip6.tracert -- `ip6 tracert <IPV6 address/Host>` /
// `ip6 tracert <IPV6 address/Host> <LAN1|...|WAN10>` (rawLine 2721) -- read
// ---------------------------------------------------------------------------

export interface Ip6TracertInput {
  readonly target: string;
  /** Optional `LAN1`..`LAN100` / `WAN1`..`WAN10` interface label. */
  readonly interfaceLabel?: string;
}

function buildTracertFrames(input: Ip6TracertInput): readonly CommandFrame[] {
  assertIpv6(input.target, "target");

  const parts = [input.target];

  if (input.interfaceLabel !== undefined) {
    assertInterfaceLabel(input.interfaceLabel, "interfaceLabel");
    parts.push(input.interfaceLabel);
  }

  return [frameSingleCommand(`ip6 tracert ${parts.join(" ")}`)];
}

export const ip6Tracert: TypedOperation<Ip6TracertInput, RawCommandOutput> = {
  manifestId: "cli.ip6.tracert",
  classification: "read",
  buildFrames: buildTracertFrames,
  parse: (exchanges) => parseTracert(firstExchangeText(exchanges)),
  executionOverride: DIAGNOSTIC_TIMEOUT_OVERRIDE,
};

// ---------------------------------------------------------------------------
// cli.ip6.addr -- discriminated union over documented variants (rawLine 2060)
// -- write.
//
// Primary write `-s` (add static address) plus clear sibling write `-d`
// (delete) and the show-ish `-a` / `-v` query variants that share this
// heading. ULA / old-prefix / prefix-list (`-l`/`-x`/`-c`/`-e`/`-p`/`-b`/
// `-t`/`-o`) sub-forms are a deliberate YAGNI deferral.
// ---------------------------------------------------------------------------

export type Ip6AddrInput =
  | {
      readonly action: "set";
      readonly prefix: string;
      readonly prefixLength: number;
      readonly interfaceLabel: string;
    }
  | {
      readonly action: "delete";
      readonly prefix: string;
      readonly prefixLength: number;
      readonly interfaceLabel: string;
    }
  | {
      readonly action: "show";
      readonly interfaceLabel?: string;
      readonly unicastOnly?: boolean;
    }
  | {
      readonly action: "showPrefix";
      readonly interfaceLabel?: string;
    };

function buildAddrFrames(input: Ip6AddrInput): readonly CommandFrame[] {
  switch (input.action) {
    case "set": {
      assertIpv6(input.prefix, "prefix");
      assertIntegerInRange(input.prefixLength, 0, 128, "prefixLength");
      assertAddrInterface(input.interfaceLabel, "interfaceLabel", true);

      return [
        frameSingleCommand(
          `ip6 addr -s ${input.prefix} ${String(input.prefixLength)} ${input.interfaceLabel}`,
        ),
      ];
    }
    case "delete": {
      assertIpv6(input.prefix, "prefix");
      assertIntegerInRange(input.prefixLength, 0, 128, "prefixLength");
      assertAddrInterface(input.interfaceLabel, "interfaceLabel", true);

      return [
        frameSingleCommand(
          `ip6 addr -d ${input.prefix} ${String(input.prefixLength)} ${input.interfaceLabel}`,
        ),
      ];
    }
    case "show": {
      const parts = ["ip6 addr -a"];

      if (input.interfaceLabel !== undefined) {
        assertAddrInterface(input.interfaceLabel, "interfaceLabel", true);
        parts.push(input.interfaceLabel);
      }

      if (input.unicastOnly === true) {
        parts.push("-u");
      }

      return [frameSingleCommand(parts.join(" "))];
    }
    case "showPrefix": {
      if (input.interfaceLabel !== undefined) {
        assertInterfaceLabel(input.interfaceLabel, "interfaceLabel");

        return [frameSingleCommand(`ip6 addr -v ${input.interfaceLabel}`)];
      }

      return [frameSingleCommand("ip6 addr -v")];
    }
  }
}

export const ip6Addr: TypedOperation<Ip6AddrInput, RawCommandOutput> = {
  manifestId: "cli.ip6.addr",
  classification: "write",
  buildFrames: buildAddrFrames,
  parse: (exchanges) => parseAddr(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ip6.mngt -- discriminated union (rawLine 2834) -- write.
//
// Documented variants: `list` / `list add|remove|flush` / `status` /
// `<service> <on|off>`.
// ---------------------------------------------------------------------------

export const IP6_MNGT_SERVICES = [
  "internet",
  "http",
  "telnet",
  "ping",
  "https",
  "ssh",
  "enforce_https",
] as const;

export type Ip6MngtService = (typeof IP6_MNGT_SERVICES)[number];

export type Ip6MngtInput =
  | { readonly action: "list" }
  | { readonly action: "listAdd"; readonly index: number; readonly objectIndex: number }
  | { readonly action: "listRemove"; readonly index: number }
  | { readonly action: "listFlush" }
  | { readonly action: "status" }
  | { readonly action: "service"; readonly service: Ip6MngtService; readonly enabled: boolean };

function buildMngtFrames(input: Ip6MngtInput): readonly CommandFrame[] {
  switch (input.action) {
    case "list": {
      return [frameSingleCommand("ip6 mngt list")];
    }
    case "listAdd": {
      assertIntegerInRange(input.index, 1, 10, "index");
      assertIntegerInRange(input.objectIndex, 1, 64, "objectIndex");

      return [
        frameSingleCommand(`ip6 mngt list add ${String(input.index)} ${String(input.objectIndex)}`),
      ];
    }
    case "listRemove": {
      assertIntegerInRange(input.index, 1, 10, "index");

      return [frameSingleCommand(`ip6 mngt list remove ${String(input.index)}`)];
    }
    case "listFlush": {
      return [frameSingleCommand("ip6 mngt list flush")];
    }
    case "status": {
      return [frameSingleCommand("ip6 mngt status")];
    }
    case "service": {
      assertOneOf(input.service, IP6_MNGT_SERVICES, "service");

      return [frameSingleCommand(`ip6 mngt ${input.service} ${input.enabled ? "on" : "off"}`)];
    }
  }
}

export const ip6Mngt: TypedOperation<Ip6MngtInput, RawCommandOutput> = {
  manifestId: "cli.ip6.mngt",
  classification: "write",
  buildFrames: buildMngtFrames,
  parse: (exchanges) => parseMngt(firstExchangeText(exchanges)),
};

const REQ_OPT_FLAGS = ["s", "S", "d", "D", "n", "i", "I", "p", "P", "b", "B", "r"] as const;

export type Ip6DhcpReqOptFlag = (typeof REQ_OPT_FLAGS)[number];

export type Ip6DhcpReqOptInput =
  | { readonly action: "show"; readonly interfaceLabel: string }
  | {
      readonly action: "set";
      readonly interfaceLabel: string;
      readonly flag: Ip6DhcpReqOptFlag;
      readonly enabled: boolean;
    };

function buildDhcpReqOptFrames(input: Ip6DhcpReqOptInput): readonly CommandFrame[] {
  assertInterfaceLabel(input.interfaceLabel, "interfaceLabel");

  if (input.action === "show") {
    return [frameSingleCommand(`ip6 dhcp req_opt ${input.interfaceLabel} -a`)];
  }

  assertOneOf(input.flag, REQ_OPT_FLAGS, "flag");

  return [
    frameSingleCommand(
      `ip6 dhcp req_opt ${input.interfaceLabel} -${input.flag} ${input.enabled ? "1" : "0"}`,
    ),
  ];
}

export const ip6DhcpReqOpt: TypedOperation<Ip6DhcpReqOptInput, RawCommandOutput> = {
  manifestId: "cli.ip6.dhcp.reqopt",
  classification: "write",
  buildFrames: buildDhcpReqOptFrames,
  parse: (exchanges) => parseDhcpReqopt(firstExchangeText(exchanges)),
};

const WAN_ONLY_PATTERN = /^WAN([1-9]|10)$/;

function assertWanLabel(value: string, name: string): void {
  if (!WAN_ONLY_PATTERN.test(value)) {
    throw new Error(`${name} must match "WAN1".."WAN10" (got "${value}").`);
  }
}

export type Ip6DhcpClientInput =
  | { readonly action: "show"; readonly wan: string }
  | { readonly action: "enable"; readonly wan: string; readonly enabled: boolean }
  | { readonly action: "release"; readonly wan: string }
  | { readonly action: "requestPd"; readonly wan: string; readonly iaid: string }
  | { readonly action: "displayDuid"; readonly wan: string };

function buildDhcpClientFrames(input: Ip6DhcpClientInput): readonly CommandFrame[] {
  assertWanLabel(input.wan, "wan");

  switch (input.action) {
    case "show": {
      return [frameSingleCommand(`ip6 dhcp client ${input.wan} -a`)];
    }
    case "enable": {
      return [frameSingleCommand(`ip6 dhcp client ${input.wan} -e ${input.enabled ? "1" : "0"}`)];
    }
    case "release": {
      return [frameSingleCommand(`ip6 dhcp client ${input.wan} -r`)];
    }
    case "requestPd": {
      assertNonEmptyString(input.iaid, "iaid");

      return [frameSingleCommand(`ip6 dhcp client ${input.wan} -p ${input.iaid}`)];
    }
    case "displayDuid": {
      return [frameSingleCommand(`ip6 dhcp client ${input.wan} -d`)];
    }
  }
}

function assertNonEmptyString(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
}

export const ip6DhcpClient: TypedOperation<Ip6DhcpClientInput, RawCommandOutput> = {
  manifestId: "cli.ip6.dhcp.client",
  classification: "write",
  buildFrames: buildDhcpClientFrames,
  parse: (exchanges) => parseDhcpClient(firstExchangeText(exchanges)),
};

export type Ip6DhcpServerInput =
  | { readonly action: "show" }
  | { readonly action: "showAssignment" }
  | { readonly action: "enable"; readonly enabled: boolean }
  | { readonly action: "setPoolMin"; readonly address: string }
  | { readonly action: "setPoolMax"; readonly address: string }
  | { readonly action: "setDns1"; readonly address: string }
  | { readonly action: "setDns2"; readonly address: string };

function buildDhcpServerFrames(input: Ip6DhcpServerInput): readonly CommandFrame[] {
  switch (input.action) {
    case "show": {
      return [frameSingleCommand("ip6 dhcp server -a")];
    }
    case "showAssignment": {
      return [frameSingleCommand("ip6 dhcp server -b")];
    }
    case "enable": {
      return [frameSingleCommand(`ip6 dhcp server -e ${input.enabled ? "1" : "0"}`)];
    }
    case "setPoolMin": {
      assertIpv6(input.address, "address");

      return [frameSingleCommand(`ip6 dhcp server -i ${input.address}`)];
    }
    case "setPoolMax": {
      assertIpv6(input.address, "address");

      return [frameSingleCommand(`ip6 dhcp server -x ${input.address}`)];
    }
    case "setDns1": {
      assertIpv6(input.address, "address");

      return [frameSingleCommand(`ip6 dhcp server -d ${input.address}`)];
    }
    case "setDns2": {
      assertIpv6(input.address, "address");

      return [frameSingleCommand(`ip6 dhcp server -D ${input.address}`)];
    }
  }
}

export const ip6DhcpServer: TypedOperation<Ip6DhcpServerInput, RawCommandOutput> = {
  manifestId: "cli.ip6.dhcp.server",
  classification: "write",
  buildFrames: buildDhcpServerFrames,
  parse: (exchanges) => parseDhcpServer(firstExchangeText(exchanges)),
};

export type Ip6DhcpOptionCInput =
  | { readonly action: "list" }
  | { readonly action: "delete"; readonly index: number }
  | {
      readonly action: "setAscii";
      readonly enabled: boolean;
      readonly wan: string;
      readonly optionNumber: number;
      readonly value: string;
    }
  | {
      readonly action: "setHex";
      readonly enabled: boolean;
      readonly wan: string;
      readonly optionNumber: number;
      readonly value: string;
    }
  | {
      readonly action: "setIp";
      readonly enabled: boolean;
      readonly wan: string;
      readonly optionNumber: number;
      readonly value: string;
    }
  | { readonly action: "update"; readonly index: number }
  | { readonly action: "removeAll" };

function assertWanNumberList(value: string, name: string): void {
  if (!/^([1-9]|10)(\/([1-9]|10))*$/.test(value)) {
    throw new Error(
      `${name} must be a WAN number or slash-separated list like "1" or "1/2" (got "${value}").`,
    );
  }
}

function buildDhcpOptionCFrames(input: Ip6DhcpOptionCInput): readonly CommandFrame[] {
  switch (input.action) {
    case "list": {
      return [frameSingleCommand("ip6 dhcp option_c -l")];
    }
    case "delete": {
      assertIntegerInRange(input.index, 1, 35, "index");

      return [frameSingleCommand(`ip6 dhcp option_c -d ${String(input.index)}`)];
    }
    case "setAscii": {
      assertWanNumberList(input.wan, "wan");
      assertIntegerInRange(input.optionNumber, 0, 65_535, "optionNumber");
      assertNonEmptyString(input.value, "value");

      return [
        frameSingleCommand(
          `ip6 dhcp option_c -e ${input.enabled ? "1" : "0"} -w ${input.wan} -c ${String(input.optionNumber)} -v ${input.value}`,
        ),
      ];
    }
    case "setHex": {
      assertWanNumberList(input.wan, "wan");
      assertIntegerInRange(input.optionNumber, 0, 65_535, "optionNumber");
      assertNonEmptyString(input.value, "value");

      return [
        frameSingleCommand(
          `ip6 dhcp option_c -e ${input.enabled ? "1" : "0"} -w ${input.wan} -c ${String(input.optionNumber)} -x ${input.value}`,
        ),
      ];
    }
    case "setIp": {
      assertWanNumberList(input.wan, "wan");
      assertIntegerInRange(input.optionNumber, 0, 65_535, "optionNumber");
      assertIpv6(input.value, "value");

      return [
        frameSingleCommand(
          `ip6 dhcp option_c -e ${input.enabled ? "1" : "0"} -w ${input.wan} -c ${String(input.optionNumber)} -a ${input.value}`,
        ),
      ];
    }
    case "update": {
      assertIntegerInRange(input.index, 1, 35, "index");

      return [frameSingleCommand(`ip6 dhcp option_c -u ${String(input.index)}`)];
    }
    case "removeAll": {
      return [frameSingleCommand("ip6 dhcp option_c -r")];
    }
  }
}

export const ip6DhcpOptionC: TypedOperation<Ip6DhcpOptionCInput, RawCommandOutput> = {
  manifestId: "cli.ip6.dhcp.optionc",
  classification: "write",
  buildFrames: buildDhcpOptionCFrames,
  parse: (exchanges) => parseDhcpOptionc(firstExchangeText(exchanges)),
};

export type Ip6DhcpOptionSInput =
  | { readonly action: "list" }
  | { readonly action: "delete"; readonly index: number }
  | {
      readonly action: "setHex";
      readonly enabled: boolean;
      readonly lan: string;
      readonly optionNumber: number;
      readonly value: string;
    }
  | {
      readonly action: "setAscii";
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
  | { readonly action: "update"; readonly index: number }
  | { readonly action: "removeAll" };

function assertOptionSLan(value: string): void {
  if (!/^([1-9]\d?|100|a|r)(\/([1-9]\d?|100|a|r))*$/i.test(value)) {
    throw new Error(
      `lan must match LAN numbers/"a"/"r" or a slash-separated list (got "${value}").`,
    );
  }
}

function buildDhcpOptionSFrames(input: Ip6DhcpOptionSInput): readonly CommandFrame[] {
  switch (input.action) {
    case "list": {
      return [frameSingleCommand("ip6 dhcp option_s -l")];
    }
    case "delete": {
      assertIntegerInRange(input.index, 1, 40, "index");

      return [frameSingleCommand(`ip6 dhcp option_s -d ${String(input.index)}`)];
    }
    case "setHex": {
      assertOptionSLan(input.lan);
      assertIntegerInRange(input.optionNumber, 0, 65_535, "optionNumber");
      assertNonEmptyString(input.value, "value");

      return [
        frameSingleCommand(
          `ip6 dhcp option_s -e ${input.enabled ? "1" : "0"} -i ${input.lan} -c ${String(input.optionNumber)} -x ${input.value}`,
        ),
      ];
    }
    case "setAscii": {
      assertOptionSLan(input.lan);
      assertIntegerInRange(input.optionNumber, 0, 65_535, "optionNumber");
      assertNonEmptyString(input.value, "value");

      return [
        frameSingleCommand(
          `ip6 dhcp option_s -e ${input.enabled ? "1" : "0"} -i ${input.lan} -c ${String(input.optionNumber)} -v ${input.value}`,
        ),
      ];
    }
    case "setIp": {
      assertOptionSLan(input.lan);
      assertIntegerInRange(input.optionNumber, 0, 65_535, "optionNumber");
      assertIpv6(input.value, "value");

      return [
        frameSingleCommand(
          `ip6 dhcp option_s -e ${input.enabled ? "1" : "0"} -i ${input.lan} -c ${String(input.optionNumber)} -a ${input.value}`,
        ),
      ];
    }
    case "update": {
      assertIntegerInRange(input.index, 1, 40, "index");

      return [frameSingleCommand(`ip6 dhcp option_s -u ${String(input.index)}`)];
    }
    case "removeAll": {
      return [frameSingleCommand("ip6 dhcp option_s -r")];
    }
  }
}

export const ip6DhcpOptionS: TypedOperation<Ip6DhcpOptionSInput, RawCommandOutput> = {
  manifestId: "cli.ip6.dhcp.options",
  classification: "write",
  buildFrames: buildDhcpOptionSFrames,
  parse: (exchanges) => parseDhcpOptions(firstExchangeText(exchanges)),
};

export type Ip6InternetInput =
  | {
      readonly action: "set";
      readonly wan: number;
      readonly mode: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
      readonly username?: string;
      readonly password?: string;
      readonly server?: string;
    }
  | { readonly action: "view" }
  | { readonly action: "dial" }
  | { readonly action: "drop" };

function buildInternetFrames(input: Ip6InternetInput): readonly CommandFrame[] {
  switch (input.action) {
    case "view": {
      return [frameSingleCommand("ip6 internet -V")];
    }
    case "dial": {
      return [frameSingleCommand("ip6 internet -k")];
    }
    case "drop": {
      return [frameSingleCommand("ip6 internet -j")];
    }
    case "set": {
      assertIntegerInRange(input.wan, 1, 10, "wan");
      assertNumberOneOf<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>(
        input.mode,
        [0, 1, 2, 3, 4, 5, 6, 7],
        "mode",
      );

      const parts = [`ip6 internet -W ${String(input.wan)} -M ${String(input.mode)}`];

      if (input.username !== undefined) {
        assertNonEmptyString(input.username, "username");
        parts.push(`-u ${input.username}`);
      }

      if (input.password !== undefined) {
        assertNonEmptyString(input.password, "password");
        parts.push(`-p ${input.password}`);
      }

      if (input.server !== undefined) {
        assertNonEmptyString(input.server, "server");
        parts.push(`-s ${input.server}`);
      }

      return [frameSingleCommand(parts.join(" "))];
    }
  }
}

function assertNumberOneOfLocal<T extends number>(
  value: T,
  allowed: readonly T[],
  name: string,
): void {
  if (!(allowed as readonly number[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => String(entry)).join(", ")} (got ${String(value)}).`,
    );
  }
}

// Reuse the existing assertOneOf for strings; numeric helper alias for clarity above.
const assertNumberOneOf = assertNumberOneOfLocal;

export const ip6Internet: TypedOperation<Ip6InternetInput, RawCommandOutput> = {
  manifestId: "cli.ip6.internet",
  classification: "write",
  buildFrames: buildInternetFrames,
  parse: (exchanges) => parseInternet(firstExchangeText(exchanges)),
};

const MAC_PATTERN = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

function assertMac(value: string, name: string): void {
  if (!MAC_PATTERN.test(value)) {
    throw new Error(`${name} must be a MAC address XX:XX:XX:XX:XX:XX (got "${value}").`);
  }
}

export interface Ip6NeighAInput {
  readonly address?: string;
  readonly interfaceLabel?: string;
}

function buildNeighAFrames(input: Ip6NeighAInput): readonly CommandFrame[] {
  const parts = ["ip6 neigh -a"];

  if (input.address !== undefined) {
    assertIpv6(input.address, "address");
    parts.push(input.address);
  }

  if (input.interfaceLabel !== undefined) {
    assertInterfaceLabel(input.interfaceLabel, "interfaceLabel");
    parts.push(input.interfaceLabel);
  }

  return [frameSingleCommand(parts.join(" "))];
}

export const ip6NeighA: TypedOperation<Ip6NeighAInput, RawCommandOutput> = {
  manifestId: "cli.ip6.neigh.a",
  classification: "read",
  buildFrames: buildNeighAFrames,
  parse: (exchanges) => parseNeighA(firstExchangeText(exchanges)),
};

export interface Ip6NeighSInput {
  readonly address: string;
  readonly mac: string;
  readonly interfaceLabel: string;
}

function buildNeighSFrames(input: Ip6NeighSInput): readonly CommandFrame[] {
  assertIpv6(input.address, "address");
  assertMac(input.mac, "mac");
  assertInterfaceLabel(input.interfaceLabel, "interfaceLabel");

  return [frameSingleCommand(`ip6 neigh -s ${input.address} ${input.mac} ${input.interfaceLabel}`)];
}

export const ip6NeighS: TypedOperation<Ip6NeighSInput, RawCommandOutput> = {
  manifestId: "cli.ip6.neigh.s",
  classification: "write",
  buildFrames: buildNeighSFrames,
  parse: (exchanges) => parseNeighS(firstExchangeText(exchanges)),
};

export interface Ip6NeighDInput {
  readonly address: string;
  readonly interfaceLabel: string;
}

function buildNeighDFrames(input: Ip6NeighDInput): readonly CommandFrame[] {
  assertIpv6(input.address, "address");
  assertInterfaceLabel(input.interfaceLabel, "interfaceLabel");

  return [frameSingleCommand(`ip6 neigh -d ${input.address} ${input.interfaceLabel}`)];
}

export const ip6NeighD: TypedOperation<Ip6NeighDInput, RawCommandOutput> = {
  manifestId: "cli.ip6.neigh.d",
  classification: "write",
  buildFrames: buildNeighDFrames,
  parse: (exchanges) => parseNeighD(firstExchangeText(exchanges)),
};

export type Ip6PneighInput =
  | { readonly action: "set"; readonly address: string; readonly interfaceLabel: string }
  | { readonly action: "delete"; readonly address: string; readonly interfaceLabel: string }
  | { readonly action: "show"; readonly address?: string; readonly interfaceLabel?: string };

function buildPneighFrames(input: Ip6PneighInput): readonly CommandFrame[] {
  switch (input.action) {
    case "set": {
      assertIpv6(input.address, "address");
      assertInterfaceLabel(input.interfaceLabel, "interfaceLabel");

      return [frameSingleCommand(`ip6 pneigh -s ${input.address} ${input.interfaceLabel}`)];
    }
    case "delete": {
      assertIpv6(input.address, "address");
      assertInterfaceLabel(input.interfaceLabel, "interfaceLabel");

      return [frameSingleCommand(`ip6 pneigh -d ${input.address} ${input.interfaceLabel}`)];
    }
    case "show": {
      const parts = ["ip6 pneigh -a"];

      if (input.address !== undefined) {
        assertIpv6(input.address, "address");
        parts.push(input.address);
      }

      if (input.interfaceLabel !== undefined) {
        assertInterfaceLabel(input.interfaceLabel, "interfaceLabel");
        parts.push(input.interfaceLabel);
      }

      return [frameSingleCommand(parts.join(" "))];
    }
  }
}

export const ip6Pneigh: TypedOperation<Ip6PneighInput, RawCommandOutput> = {
  manifestId: "cli.ip6.pneigh",
  classification: "write",
  buildFrames: buildPneighFrames,
  parse: (exchanges) => parsePneigh(firstExchangeText(exchanges)),
};

const ROUTE_IF_PATTERN = /^(LAN([1-9][0-9]?|100)|WAN([1-9]|10)|VPN([1-9]\d{0,2}|[1-4]\d{2}|500))$/;

function assertRouteInterface(value: string, name: string): void {
  if (!ROUTE_IF_PATTERN.test(value)) {
    throw new Error(
      `${name} must match "LAN1".."LAN100", "WAN1".."WAN10", or "VPN1".."VPN500" (got "${value}").`,
    );
  }
}

export type Ip6RouteInput =
  | {
      readonly action: "set";
      readonly prefix: string;
      readonly prefixLength: number;
      readonly gateway: string;
      readonly interfaceLabel: string;
      readonly asDefault?: boolean;
    }
  | { readonly action: "delete"; readonly prefix: string; readonly prefixLength: number }
  | { readonly action: "show"; readonly interfaceLabel?: string }
  | { readonly action: "clear" };

function buildRouteFrames(input: Ip6RouteInput): readonly CommandFrame[] {
  switch (input.action) {
    case "set": {
      assertIpv6(input.prefix, "prefix");
      assertIntegerInRange(input.prefixLength, 0, 128, "prefixLength");
      assertIpv6(input.gateway, "gateway");
      assertRouteInterface(input.interfaceLabel, "interfaceLabel");

      const parts = [
        "ip6 route -s",
        input.prefix,
        String(input.prefixLength),
        input.gateway,
        input.interfaceLabel,
      ];

      if (input.asDefault === true) {
        parts.push("-D");
      }

      return [frameSingleCommand(parts.join(" "))];
    }
    case "delete": {
      assertIpv6(input.prefix, "prefix");
      assertIntegerInRange(input.prefixLength, 0, 128, "prefixLength");

      return [frameSingleCommand(`ip6 route -d ${input.prefix} ${String(input.prefixLength)}`)];
    }
    case "show": {
      if (input.interfaceLabel !== undefined) {
        assertRouteInterface(input.interfaceLabel, "interfaceLabel");

        return [frameSingleCommand(`ip6 route -a ${input.interfaceLabel}`)];
      }

      return [frameSingleCommand("ip6 route -a")];
    }
    case "clear": {
      return [frameSingleCommand("ip6 route -l")];
    }
  }
}

export const ip6Route: TypedOperation<Ip6RouteInput, RawCommandOutput> = {
  manifestId: "cli.ip6.route",
  classification: "write",
  buildFrames: buildRouteFrames,
  parse: (exchanges) => parseRoute(firstExchangeText(exchanges)),
};

export interface Ip6TspcInput {
  /** WAN interface number: 1 = WAN1, 2 = WAN2, ... */
  readonly wan: number;
}

function buildTspcFrames(input: Ip6TspcInput): readonly CommandFrame[] {
  assertIntegerInRange(input.wan, 1, 10, "wan");

  return [frameSingleCommand(`ip6 tspc ${String(input.wan)}`)];
}

export const ip6Tspc: TypedOperation<Ip6TspcInput, RawCommandOutput> = {
  manifestId: "cli.ip6.tspc",
  classification: "read",
  buildFrames: buildTspcFrames,
  parse: (exchanges) => parseTspc(firstExchangeText(exchanges)),
};

const LAN_ONLY_PATTERN = /^LAN([1-9][0-9]?|100)$/;

function assertLanLabel(value: string, name: string): void {
  if (!LAN_ONLY_PATTERN.test(value)) {
    throw new Error(`${name} must match "LAN1".."LAN100" (got "${value}").`);
  }
}

export type Ip6RadvdInput =
  | { readonly action: "enable"; readonly interfaceLabel: string; readonly enabled: boolean }
  | {
      readonly action: "setDefaultLifetime";
      readonly interfaceLabel: string;
      readonly seconds: number;
    }
  | { readonly action: "view"; readonly interfaceLabel: string }
  | { readonly action: "viewRa"; readonly interfaceLabel?: string };

function buildRadvdFrames(input: Ip6RadvdInput): readonly CommandFrame[] {
  switch (input.action) {
    case "enable": {
      assertLanLabel(input.interfaceLabel, "interfaceLabel");

      return [
        frameSingleCommand(`ip6 radvd ${input.interfaceLabel} -s ${input.enabled ? "1" : "0"}`),
      ];
    }
    case "setDefaultLifetime": {
      assertLanLabel(input.interfaceLabel, "interfaceLabel");
      assertIntegerInRange(input.seconds, 0, 9_000_000, "seconds");

      return [frameSingleCommand(`ip6 radvd ${input.interfaceLabel} -d ${String(input.seconds)}`)];
    }
    case "view": {
      assertLanLabel(input.interfaceLabel, "interfaceLabel");

      return [frameSingleCommand(`ip6 radvd ${input.interfaceLabel} -v`)];
    }
    case "viewRa": {
      if (input.interfaceLabel !== undefined) {
        assertLanLabel(input.interfaceLabel, "interfaceLabel");

        return [frameSingleCommand(`ip6 radvd ${input.interfaceLabel} -V`)];
      }

      return [frameSingleCommand("ip6 radvd -V")];
    }
  }
}

export const ip6Radvd: TypedOperation<Ip6RadvdInput, RawCommandOutput> = {
  manifestId: "cli.ip6.radvd",
  classification: "write",
  buildFrames: buildRadvdFrames,
  parse: (exchanges) => parseRadvd(firstExchangeText(exchanges)),
};

export interface Ip6OnlineInput {
  readonly wan: string;
}

function buildOnlineFrames(input: Ip6OnlineInput): readonly CommandFrame[] {
  assertWanLabel(input.wan, "wan");

  return [frameSingleCommand(`ip6 online ${input.wan}`)];
}

export const ip6Online: TypedOperation<Ip6OnlineInput, RawCommandOutput> = {
  manifestId: "cli.ip6.online",
  classification: "read",
  buildFrames: buildOnlineFrames,
  parse: (exchanges) => parseOnline(firstExchangeText(exchanges)),
};

export type Ip6AiccuInput =
  | { readonly action: "status"; readonly wan: number }
  | { readonly action: "remove"; readonly wan: number };

function buildAiccuFrames(input: Ip6AiccuInput): readonly CommandFrame[] {
  assertIntegerInRange(input.wan, 1, 10, "wan");

  if (input.action === "status") {
    return [frameSingleCommand(`ip6 aiccu -i ${String(input.wan)} -s`)];
  }

  return [frameSingleCommand(`ip6 aiccu -i ${String(input.wan)} -r`)];
}

export const ip6Aiccu: TypedOperation<Ip6AiccuInput, RawCommandOutput> = {
  manifestId: "cli.ip6.aiccu",
  classification: "write",
  buildFrames: buildAiccuFrames,
  parse: (exchanges) => parseAiccu(firstExchangeText(exchanges)),
};

function buildNtpVFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("ip6 ntp -v")];
}

export const ip6NtpV: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.ip6.ntp.v",
  classification: "read",
  buildFrames: buildNtpVFrames,
  parse: (exchanges) => parseNtpV(firstExchangeText(exchanges)),
};

export interface Ip6NtpPInput {
  /** 0 = Auto, 1 = First query IPv6 NTP server. */
  readonly priority: 0 | 1;
}

function buildNtpPFrames(input: Ip6NtpPInput): readonly CommandFrame[] {
  assertNumberOneOf<0 | 1>(input.priority, [0, 1], "priority");

  return [frameSingleCommand(`ip6 ntp -p ${String(input.priority)}`)];
}

export const ip6NtpP: TypedOperation<Ip6NtpPInput, RawCommandOutput> = {
  manifestId: "cli.ip6.ntp.p",
  classification: "write",
  buildFrames: buildNtpPFrames,
  parse: (exchanges) => parseNtpP(firstExchangeText(exchanges)),
};

export type Ip6LanInput =
  | {
      readonly action: "set";
      readonly lan: number;
      readonly primaryWan?: number;
      readonly dns1?: string;
      readonly otherOption?: boolean;
      readonly disableIpv6?: boolean;
      readonly showLan?: number;
    }
  | { readonly action: "show"; readonly lan?: number };

function buildLanFrames(input: Ip6LanInput): readonly CommandFrame[] {
  if (input.action === "show") {
    if (input.lan !== undefined) {
      assertIntegerInRange(input.lan, 0, 17, "lan");

      return [frameSingleCommand(`ip6 lan -s ${String(input.lan)}`)];
    }

    return [frameSingleCommand("ip6 lan -s 0")];
  }

  assertIntegerInRange(input.lan, 1, 100, "lan");

  const parts = [`ip6 lan -l ${String(input.lan)}`];

  if (input.primaryWan !== undefined) {
    assertIntegerInRange(input.primaryWan, 0, 10, "primaryWan");
    parts.push(`-w ${String(input.primaryWan)}`);
  }

  if (input.dns1 !== undefined) {
    assertIpv6(input.dns1, "dns1");
    parts.push(`-d ${input.dns1}`);
  }

  if (input.otherOption !== undefined) {
    parts.push(`-o ${input.otherOption ? "1" : "0"}`);
  }

  if (input.disableIpv6 !== undefined) {
    parts.push(`-f ${input.disableIpv6 ? "1" : "0"}`);
  }

  if (input.showLan !== undefined) {
    assertIntegerInRange(input.showLan, 0, 17, "showLan");
    parts.push(`-s ${String(input.showLan)}`);
  }

  return [frameSingleCommand(parts.join(" "))];
}

export const ip6Lan: TypedOperation<Ip6LanInput, RawCommandOutput> = {
  manifestId: "cli.ip6.lan",
  classification: "write",
  buildFrames: buildLanFrames,
  parse: (exchanges) => parseLan(firstExchangeText(exchanges)),
};

export type Ip6SessionInput =
  | { readonly action: "on" }
  | { readonly action: "off" }
  | { readonly action: "default"; readonly limit: number }
  | { readonly action: "status" }
  | { readonly action: "show" }
  | {
      readonly action: "add";
      readonly ipStart: string;
      readonly ipEnd: string;
      readonly limit: number;
    }
  | { readonly action: "delete"; readonly ipStart: string }
  | { readonly action: "deleteAll" };

function buildSessionFrames(input: Ip6SessionInput): readonly CommandFrame[] {
  switch (input.action) {
    case "on": {
      return [frameSingleCommand("ip6 session on")];
    }
    case "off": {
      return [frameSingleCommand("ip6 session off")];
    }
    case "default": {
      assertPositiveInteger(input.limit, "limit");

      return [frameSingleCommand(`ip6 session default ${String(input.limit)}`)];
    }
    case "status": {
      return [frameSingleCommand("ip6 session status")];
    }
    case "show": {
      return [frameSingleCommand("ip6 session show")];
    }
    case "add": {
      assertIpv6(input.ipStart, "ipStart");
      assertIpv6(input.ipEnd, "ipEnd");
      assertPositiveInteger(input.limit, "limit");

      return [
        frameSingleCommand(
          `ip6 session add ${input.ipStart}-${input.ipEnd} ${String(input.limit)}`,
        ),
      ];
    }
    case "delete": {
      assertIpv6(input.ipStart, "ipStart");

      return [frameSingleCommand(`ip6 session del ${input.ipStart}`)];
    }
    case "deleteAll": {
      return [frameSingleCommand("ip6 session del all")];
    }
  }
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer (got ${String(value)}).`);
  }
}

export const ip6Session: TypedOperation<Ip6SessionInput, RawCommandOutput> = {
  manifestId: "cli.ip6.session",
  classification: "write",
  buildFrames: buildSessionFrames,
  parse: (exchanges) => parseSession(firstExchangeText(exchanges)),
};

export type Ip6BandwidthInput =
  | { readonly action: "on" }
  | { readonly action: "off" }
  | { readonly action: "default"; readonly txRate: string; readonly rxRate: string }
  | { readonly action: "status" }
  | { readonly action: "show" }
  | {
      readonly action: "add";
      readonly ipStart: string;
      readonly ipEnd: string;
      readonly txRate: string;
      readonly rxRate: string;
      /** Only the documented `shared` token is modelled (YAGNI for undocumented alternatives). */
      readonly shared: true;
    }
  | { readonly action: "delete"; readonly ipStart: string }
  | { readonly action: "deleteAll" };

function assertBandwidthRateToken(value: string, name: string): void {
  if (!/^\d+[KkMm]?$/.test(value)) {
    throw new Error(`${name} must be a numeric rate token like "512" or "5M" (got "${value}").`);
  }
}

function buildBandwidthFrames(input: Ip6BandwidthInput): readonly CommandFrame[] {
  switch (input.action) {
    case "on": {
      return [frameSingleCommand("ip6 bandwidth on")];
    }
    case "off": {
      return [frameSingleCommand("ip6 bandwidth off")];
    }
    case "default": {
      assertBandwidthRateToken(input.txRate, "txRate");
      assertBandwidthRateToken(input.rxRate, "rxRate");

      return [frameSingleCommand(`ip6 bandwidth default ${input.txRate} ${input.rxRate}`)];
    }
    case "status": {
      return [frameSingleCommand("ip6 bandwidth status")];
    }
    case "show": {
      return [frameSingleCommand("ip6 bandwidth show")];
    }
    case "add": {
      assertIpv6(input.ipStart, "ipStart");
      assertIpv6(input.ipEnd, "ipEnd");
      assertBandwidthRateToken(input.txRate, "txRate");
      assertBandwidthRateToken(input.rxRate, "rxRate");

      return [
        frameSingleCommand(
          `ip6 bandwidth add ${input.ipStart}-${input.ipEnd} ${input.txRate} ${input.rxRate} shared`,
        ),
      ];
    }
    case "delete": {
      assertIpv6(input.ipStart, "ipStart");

      return [frameSingleCommand(`ip6 bandwidth del ${input.ipStart}`)];
    }
    case "deleteAll": {
      return [frameSingleCommand("ip6 bandwidth del all")];
    }
  }
}

export const ip6Bandwidth: TypedOperation<Ip6BandwidthInput, RawCommandOutput> = {
  manifestId: "cli.ip6.bandwidth",
  classification: "write",
  buildFrames: buildBandwidthFrames,
  parse: (exchanges) => parseBandwidth(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  ip6Ping,
  ip6Tracert,
  ip6Addr,
  ip6Mngt,
  ip6DhcpReqOpt,
  ip6DhcpClient,
  ip6DhcpServer,
  ip6DhcpOptionC,
  ip6DhcpOptionS,
  ip6Internet,
  ip6NeighA,
  ip6NeighS,
  ip6NeighD,
  ip6Pneigh,
  ip6Route,
  ip6Tspc,
  ip6Radvd,
  ip6Online,
  ip6Aiccu,
  ip6NtpV,
  ip6NtpP,
  ip6Lan,
  ip6Session,
  ip6Bandwidth,
];
