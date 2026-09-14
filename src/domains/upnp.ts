/**
 * `upnp` domain -- Wave 4 Item5-upnp (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements classified `cli.upnp.*` entries including previously deferred
 * `service` / `subscribe` / `tmpvs` reads and `wan` write.
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/upnp/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseUpnpOff } from "../internal/parsers/upnp/off.js";
import { parseUpnpOn } from "../internal/parsers/upnp/on.js";
import { parseUpnpNat, type UpnpNatReport } from "../internal/parsers/upnp/nat.js";
import { parseService } from "../internal/parsers/upnp/service.js";
import { parseSubscribe } from "../internal/parsers/upnp/subscribe.js";
import { parseTmpvs } from "../internal/parsers/upnp/tmpvs.js";
import { parseWan } from "../internal/parsers/upnp/wan.js";
import type { RawCommandOutput } from "../internal/parsers/upnp/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

// ---------------------------------------------------------------------------
// cli.upnp.off -- `upnp off` (rawLine 9014) -- "This command can close UPnP
// function."
// ---------------------------------------------------------------------------

function buildUpnpOffFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("upnp off")];
}

export const upnpOff: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.upnp.off",
  classification: "write",
  buildFrames: buildUpnpOffFrames,
  parse: (exchanges) => parseUpnpOff(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.upnp.on -- `upnp on` (rawLine 9020) -- "This command can enable UPnP
// function."
// ---------------------------------------------------------------------------

function buildUpnpOnFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("upnp on")];
}

export const upnpOn: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.upnp.on",
  classification: "write",
  buildFrames: buildUpnpOnFrames,
  parse: (exchanges) => parseUpnpOn(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.upnp.nat -- `upnp nat` (rawLine 9029) -- "This command can display IGD
// NAT status." -- read.
// ---------------------------------------------------------------------------

function buildUpnpNatFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("upnp nat")];
}

export const upnpNat: TypedOperation<void, UpnpNatReport> = {
  manifestId: "cli.upnp.nat",
  classification: "read",
  buildFrames: buildUpnpNatFrames,
  parse: (exchanges) => parseUpnpNat(firstExchangeText(exchanges)),
};

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

// ---------------------------------------------------------------------------
// cli.upnp.service -- `upnp service` (rawLine 9054) -- read.
// ---------------------------------------------------------------------------

function buildUpnpServiceFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("upnp service")];
}

export const upnpService: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.upnp.service",
  classification: "read",
  buildFrames: buildUpnpServiceFrames,
  parse: (exchanges) => parseService(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.upnp.subscribe -- `upnp subscribe` (rawLine 9084) -- read.
// ---------------------------------------------------------------------------

function buildUpnpSubscribeFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("upnp subscribe")];
}

export const upnpSubscribe: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.upnp.subscribe",
  classification: "read",
  buildFrames: buildUpnpSubscribeFrames,
  parse: (exchanges) => parseSubscribe(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.upnp.tmpvs -- `upnp tmpvs` (rawLine 9116) -- read.
// ---------------------------------------------------------------------------

function buildUpnpTmpvsFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("upnp tmpvs")];
}

export const upnpTmpvs: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.upnp.tmpvs",
  classification: "read",
  buildFrames: buildUpnpTmpvsFrames,
  parse: (exchanges) => parseTmpvs(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.upnp.wan -- `upnp wan <n>` (rawLine 9140) -- write (0=auto, 1..12=WANn).
// ---------------------------------------------------------------------------

export interface UpnpWanInput {
  readonly wanIndex: number;
}

function buildUpnpWanFrames(input: UpnpWanInput): readonly CommandFrame[] {
  assertIntegerInRange(input.wanIndex, 0, 12, "wanIndex");

  return [frameSingleCommand(`upnp wan ${String(input.wanIndex)}`)];
}

export const upnpWan: TypedOperation<UpnpWanInput, RawCommandOutput> = {
  manifestId: "cli.upnp.wan",
  classification: "write",
  buildFrames: buildUpnpWanFrames,
  parse: (exchanges) => parseWan(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  upnpOff,
  upnpOn,
  upnpNat,
  upnpService,
  upnpSubscribe,
  upnpTmpvs,
  upnpWan,
];
