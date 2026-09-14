/**
 * `portmaptime` domain -- Wave 4 family implementation (`BACKLOG.md`
 * "Wave 4" family task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements all 3 already-classified `cli.portmaptime.*` manifest entries
 * from the Part VIII `SPLIT_FAMILIES` split (rawLine 6417):
 * `cli.portmaptime.l` (read), `cli.portmaptime.f` (write flush), and
 * `cli.portmaptime` (write timeout setters). Basis `documented-syntax`;
 * sibling `vigor3912s-mcp` consulted read-only as evidence.
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/portmaptime/*.ts`.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseList } from "../internal/parsers/portmaptime/list.js";
import { parseFlush } from "../internal/parsers/portmaptime/flush.js";
import { parseSet } from "../internal/parsers/portmaptime/set.js";
import type { RawCommandOutput } from "../internal/parsers/portmaptime/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer (got ${String(value)}).`);
  }
}

function assertPositiveInteger(value: number, name: string): void {
  assertInteger(value, name);

  if (value <= 0) {
    throw new Error(`${name} must be a positive integer (got ${String(value)}).`);
  }
}

// ---------------------------------------------------------------------------
// cli.portmaptime.l -- `portmaptime -l` (rawLine 6417) -- read
// ---------------------------------------------------------------------------

function buildListFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("portmaptime -l")];
}

export const portmaptimeList: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.portmaptime.l",
  classification: "read",
  buildFrames: buildListFrames,
  parse: (exchanges) => parseList(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.portmaptime.f -- `portmaptime -f` (rawLine 6417) -- write
// ---------------------------------------------------------------------------

function buildFlushFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("portmaptime -f")];
}

export const portmaptimeFlush: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.portmaptime.f",
  classification: "write",
  buildFrames: buildFlushFrames,
  parse: (exchanges) => parseFlush(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.portmaptime -- `portmaptime -t/-u/-i/-w/-s <sec>` (rawLine 6417) --
// write. Freely combinable timeout flags; at least one required.
// ---------------------------------------------------------------------------

export interface PortmaptimeSetInput {
  /** `-t <sec>`: TCP session timeout. */
  readonly tcpTimeoutSeconds?: number;
  /** `-u <sec>`: UDP session timeout. */
  readonly udpTimeoutSeconds?: number;
  /** `-i <sec>`: IGMP session timeout. */
  readonly igmpTimeoutSeconds?: number;
  /** `-w <sec>`: TCP WWW session timeout. */
  readonly tcpWwwTimeoutSeconds?: number;
  /** `-s <sec>`: TCP SYN session timeout. */
  readonly tcpSynTimeoutSeconds?: number;
}

function buildSetFrames(input: PortmaptimeSetInput): readonly CommandFrame[] {
  const parts: string[] = ["portmaptime"];

  if (input.tcpTimeoutSeconds !== undefined) {
    assertPositiveInteger(input.tcpTimeoutSeconds, "tcpTimeoutSeconds");
    parts.push(`-t ${String(input.tcpTimeoutSeconds)}`);
  }
  if (input.udpTimeoutSeconds !== undefined) {
    assertPositiveInteger(input.udpTimeoutSeconds, "udpTimeoutSeconds");
    parts.push(`-u ${String(input.udpTimeoutSeconds)}`);
  }
  if (input.igmpTimeoutSeconds !== undefined) {
    assertPositiveInteger(input.igmpTimeoutSeconds, "igmpTimeoutSeconds");
    parts.push(`-i ${String(input.igmpTimeoutSeconds)}`);
  }
  if (input.tcpWwwTimeoutSeconds !== undefined) {
    assertPositiveInteger(input.tcpWwwTimeoutSeconds, "tcpWwwTimeoutSeconds");
    parts.push(`-w ${String(input.tcpWwwTimeoutSeconds)}`);
  }
  if (input.tcpSynTimeoutSeconds !== undefined) {
    assertPositiveInteger(input.tcpSynTimeoutSeconds, "tcpSynTimeoutSeconds");
    parts.push(`-s ${String(input.tcpSynTimeoutSeconds)}`);
  }

  if (parts.length === 1) {
    throw new Error("At least one portmaptime timeout option must be provided.");
  }

  return [frameSingleCommand(parts.join(" "))];
}

export const portmaptimeSet: TypedOperation<PortmaptimeSetInput, RawCommandOutput> = {
  manifestId: "cli.portmaptime",
  classification: "write",
  buildFrames: buildSetFrames,
  parse: (exchanges) => parseSet(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  portmaptimeList,
  portmaptimeFlush,
  portmaptimeSet,
];
