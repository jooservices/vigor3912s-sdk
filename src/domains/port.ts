/**
 * `port` domain -- Wave 4 family implementation (`BACKLOG.md` "Wave 4"
 * family task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements all 9 already-classified `cli.port.*` manifest entries from
 * the Part VIII `SPLIT_FAMILIES` split of the `port` heading (rawLine
 * 6349): status/sniff-status/802.1x-status reads; sniff/802.1x
 * enable|disable|addport|delport writes; and `cli.port` for physical
 * speed/duplex configuration. Basis `documented-syntax`; sibling
 * `vigor3912s-mcp` consulted read-only as evidence.
 *
 * Multi-variant headings use discriminated unions (`port sniff`,
 * `port <lan|wan> <speed>`). The per-port `status` speed token is owned by
 * `cli.port.status` / the per-port status form is not re-modelled under
 * `cli.port` (YAGNI: the split already extracted the global status read).
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/port/*.ts`.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseStatus } from "../internal/parsers/port/status.js";
import { parseSniffStatus } from "../internal/parsers/port/sniff-status.js";
import { parseSniff } from "../internal/parsers/port/sniff.js";
import { parseDot1xStatus } from "../internal/parsers/port/dot1x-status.js";
import { parseDot1xEnable } from "../internal/parsers/port/dot1x-enable.js";
import { parseDot1xDisable } from "../internal/parsers/port/dot1x-disable.js";
import { parseDot1xAddport } from "../internal/parsers/port/dot1x-addport.js";
import { parseDot1xDelport } from "../internal/parsers/port/dot1x-delport.js";
import { parseSpeed } from "../internal/parsers/port/speed.js";
import type { RawCommandOutput } from "../internal/parsers/port/shared.js";

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

function assertOneOf<T extends string>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => `"${entry}"`).join(", ")} (got "${value}").`,
    );
  }
}

function assertPositiveInteger(value: number, name: string): void {
  assertInteger(value, name);
  if (value <= 0) {
    throw new Error(`${name} must be a positive integer (got ${String(value)}).`);
  }
}

// ---------------------------------------------------------------------------
// cli.port.status -- `port status` (rawLine 6349) -- read
// ---------------------------------------------------------------------------

function buildStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("port status")];
}

export const portStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.port.status",
  classification: "read",
  buildFrames: buildStatusFrames,
  parse: (exchanges) => parseStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.port.sniff.status -- `port sniff status` (rawLine 6349) -- read
// ---------------------------------------------------------------------------

function buildSniffStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("port sniff status")];
}

export const portSniffStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.port.sniff.status",
  classification: "read",
  buildFrames: buildSniffStatusFrames,
  parse: (exchanges) => parseSniffStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.port.sniff -- `port sniff <on|off|port|txrx|restart>` (rawLine 6349)
// -- write
// ---------------------------------------------------------------------------

export type PortSniffInput =
  | { readonly action: "on" }
  | { readonly action: "off" }
  | { readonly action: "restart" }
  | { readonly action: "port"; readonly lanPort: "p1" | "p2" | "p3" | "p4" }
  | { readonly action: "txrx"; readonly rate: number; readonly lanPort: "p1" | "p2" | "p3" | "p4" };

const PORT_SNIFF_LAN_PORTS = ["p1", "p2", "p3", "p4"] as const;

function buildSniffFrames(input: PortSniffInput): readonly CommandFrame[] {
  switch (input.action) {
    case "on":
    case "off":
    case "restart":
      return [frameSingleCommand(`port sniff ${input.action}`)];
    case "port":
      assertOneOf(input.lanPort, PORT_SNIFF_LAN_PORTS, "lanPort");
      return [frameSingleCommand(`port sniff port ${input.lanPort}`)];
    case "txrx":
      assertPositiveInteger(input.rate, "rate");
      assertOneOf(input.lanPort, PORT_SNIFF_LAN_PORTS, "lanPort");
      return [frameSingleCommand(`port sniff txrx ${String(input.rate)} ${input.lanPort}`)];
    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}

export const portSniff: TypedOperation<PortSniffInput, RawCommandOutput> = {
  manifestId: "cli.port.sniff",
  classification: "write",
  buildFrames: buildSniffFrames,
  parse: (exchanges) => parseSniff(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.port.8021x.status -- `port 802.1x status` (rawLine 6349) -- read
// ---------------------------------------------------------------------------

function buildDot1xStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("port 802.1x status")];
}

export const port8021xStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.port.8021x.status",
  classification: "read",
  buildFrames: buildDot1xStatusFrames,
  parse: (exchanges) => parseDot1xStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.port.8021x.enable -- `port 802.1x enable` (rawLine 6349) -- write
// ---------------------------------------------------------------------------

function buildDot1xEnableFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("port 802.1x enable")];
}

export const port8021xEnable: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.port.8021x.enable",
  classification: "write",
  buildFrames: buildDot1xEnableFrames,
  parse: (exchanges) => parseDot1xEnable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.port.8021x.disable -- `port 802.1x disable` (rawLine 6349) -- write
// ---------------------------------------------------------------------------

function buildDot1xDisableFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("port 802.1x disable")];
}

export const port8021xDisable: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.port.8021x.disable",
  classification: "write",
  buildFrames: buildDot1xDisableFrames,
  parse: (exchanges) => parseDot1xDisable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.port.8021x.addport -- `port 802.1x addport <1-5>` (rawLine 6349) --
// write
// ---------------------------------------------------------------------------

export interface Port8021xPortInput {
  readonly portNumber: number;
}

function buildDot1xAddportFrames(input: Port8021xPortInput): readonly CommandFrame[] {
  assertIntegerInRange(input.portNumber, 1, 5, "portNumber");
  return [frameSingleCommand(`port 802.1x addport ${String(input.portNumber)}`)];
}

export const port8021xAddport: TypedOperation<Port8021xPortInput, RawCommandOutput> = {
  manifestId: "cli.port.8021x.addport",
  classification: "write",
  buildFrames: buildDot1xAddportFrames,
  parse: (exchanges) => parseDot1xAddport(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.port.8021x.delport -- `port 802.1x delport <1-5>` (rawLine 6349) --
// write
// ---------------------------------------------------------------------------

function buildDot1xDelportFrames(input: Port8021xPortInput): readonly CommandFrame[] {
  assertIntegerInRange(input.portNumber, 1, 5, "portNumber");
  return [frameSingleCommand(`port 802.1x delport ${String(input.portNumber)}`)];
}

export const port8021xDelport: TypedOperation<Port8021xPortInput, RawCommandOutput> = {
  manifestId: "cli.port.8021x.delport",
  classification: "write",
  buildFrames: buildDot1xDelportFrames,
  parse: (exchanges) => parseDot1xDelport(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.port -- `port <lan|wan> <speed>` (rawLine 6349) -- write
// ---------------------------------------------------------------------------

export type PortSpeedInput =
  | {
      readonly kind: "lan";
      readonly port:
        "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "all";
      readonly speed: "AN" | "100F" | "100H" | "10F" | "10H";
    }
  | {
      readonly kind: "wan";
      readonly port: "wan1" | "wan2" | "wan3" | "wan4";
      readonly speed: "AN" | "1000F" | "100F" | "100H" | "10F" | "10H";
    };

const LAN_PORTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "all"] as const;
const LAN_SPEEDS = ["AN", "100F", "100H", "10F", "10H"] as const;
const WAN_PORTS = ["wan1", "wan2", "wan3", "wan4"] as const;
const WAN_SPEEDS = ["AN", "1000F", "100F", "100H", "10F", "10H"] as const;

function buildSpeedFrames(input: PortSpeedInput): readonly CommandFrame[] {
  if (input.kind === "lan") {
    assertOneOf(input.port, LAN_PORTS, "port");
    assertOneOf(input.speed, LAN_SPEEDS, "speed");
    return [frameSingleCommand(`port ${input.port} ${input.speed}`)];
  }

  assertOneOf(input.port, WAN_PORTS, "port");
  assertOneOf(input.speed, WAN_SPEEDS, "speed");
  return [frameSingleCommand(`port ${input.port} ${input.speed}`)];
}

export const portSpeed: TypedOperation<PortSpeedInput, RawCommandOutput> = {
  manifestId: "cli.port",
  classification: "write",
  buildFrames: buildSpeedFrames,
  parse: (exchanges) => parseSpeed(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  portStatus,
  portSniffStatus,
  portSniff,
  port8021xStatus,
  port8021xEnable,
  port8021xDisable,
  port8021xAddport,
  port8021xDelport,
  portSpeed,
];
