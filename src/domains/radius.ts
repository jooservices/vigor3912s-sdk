/**
 * `radius` domain -- Wave 4 family implementation (`BACKLOG.md` "Wave 4"
 * family task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements all 12 already-classified `cli.radius.*` manifest entries from
 * the Part VIII `SPLIT_FAMILIES` splits of `radius internal` (rawLine
 * 11570) and `radius external` (rawLine 11632). Basis
 * `documented-syntax`; sibling `vigor3912s-mcp` consulted read-only as
 * evidence (partial coverage -- `show` only there).
 *
 * `radius set_dot1x_method` uses a discriminated `-e`/`-d` union.
 * `radius external` configure follows the `ha set` flat `args` allowlist
 * precedent for freely-combinable flags; `-V`/`-v`/`-l` are owned by
 * their own read operations and are excluded from that allowlist.
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/radius/*.ts`.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseShow } from "../internal/parsers/radius/show.js";
import { parseEnable } from "../internal/parsers/radius/enable.js";
import { parseAuthport } from "../internal/parsers/radius/authport.js";
import { parseSetAuthMethod } from "../internal/parsers/radius/set-auth-method.js";
import { parseClientAdd } from "../internal/parsers/radius/client-add.js";
import { parseClientDel } from "../internal/parsers/radius/client-del.js";
import { parseEnableDot1x } from "../internal/parsers/radius/enable-dot1x.js";
import { parseSetDot1xMethod } from "../internal/parsers/radius/set-dot1x-method.js";
import { parseExternalView } from "../internal/parsers/radius/external-view.js";
import { parseExternalViewProfile } from "../internal/parsers/radius/external-view-profile.js";
import { parseExternalLog } from "../internal/parsers/radius/external-log.js";
import { parseExternal } from "../internal/parsers/radius/external.js";
import { parseShowLocalCer } from "../internal/parsers/radius/showlocalcer.js";
import type { RawCommandOutput } from "../internal/parsers/radius/shared.js";

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

const SINGLE_CLI_TOKEN_PATTERN = /^\S+$/;

function assertSingleToken(value: string, name: string): void {
  // Never interpolate `value` into the message — callers use this for shared
  // secrets; echoing rejected secrets would leak into Error.message.
  if (!SINGLE_CLI_TOKEN_PATTERN.test(value)) {
    throw new Error(`${name} must be a single non-empty token with no whitespace.`);
  }
}

function assertNonEmptyToken(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty or whitespace-only.`);
  }
  if (/\s/.test(value)) {
    throw new Error(`${label} must not contain whitespace.`);
  }
}

function assertArgsShape(args: readonly string[], label: string): void {
  if (args.length === 0) {
    throw new Error(`${label} requires at least one argument token.`);
  }
  for (const [index, token] of args.entries()) {
    assertNonEmptyToken(token, `${label} argument #${String(index + 1)}`);
  }
}

function assertKnownFlags(
  args: readonly string[],
  allowedFlags: readonly string[],
  label: string,
): void {
  for (const token of args) {
    if (token.startsWith("-") && !allowedFlags.includes(token)) {
      throw new Error(
        `${label} flag "${token}" is not one of the documented flags: ${allowedFlags.join(", ")}.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// cli.radius.show -- `radius show` (rawLine 11570) -- read
// ---------------------------------------------------------------------------

function buildShowFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("radius show")];
}

export const radiusShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.radius.show",
  classification: "read",
  buildFrames: buildShowFrames,
  parse: (exchanges) => parseShow(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.enable -- `radius enable <0/1>` (rawLine 11570) -- write
// ---------------------------------------------------------------------------

export interface RadiusEnableInput {
  readonly enabled: boolean;
}

function buildEnableFrames(input: RadiusEnableInput): readonly CommandFrame[] {
  return [frameSingleCommand(`radius enable ${input.enabled ? "1" : "0"}`)];
}

export const radiusEnable: TypedOperation<RadiusEnableInput, RawCommandOutput> = {
  manifestId: "cli.radius.enable",
  classification: "write",
  buildFrames: buildEnableFrames,
  parse: (exchanges) => parseEnable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.authport -- `radius authport <port>` (rawLine 11570) -- write
// ---------------------------------------------------------------------------

export interface RadiusAuthportInput {
  readonly port: number;
}

function buildAuthportFrames(input: RadiusAuthportInput): readonly CommandFrame[] {
  assertIntegerInRange(input.port, 0, 65535, "port");
  return [frameSingleCommand(`radius authport ${String(input.port)}`)];
}

export const radiusAuthport: TypedOperation<RadiusAuthportInput, RawCommandOutput> = {
  manifestId: "cli.radius.authport",
  classification: "write",
  buildFrames: buildAuthportFrames,
  parse: (exchanges) => parseAuthport(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.setauthmethod -- `radius set_auth_method <0/1>` (rawLine
// 11570) -- write
// ---------------------------------------------------------------------------

export interface RadiusSetAuthMethodInput {
  readonly methodIndex: 0 | 1;
}

function buildSetAuthMethodFrames(input: RadiusSetAuthMethodInput): readonly CommandFrame[] {
  assertNumberOneOf(input.methodIndex, [0, 1], "methodIndex");
  return [frameSingleCommand(`radius set_auth_method ${String(input.methodIndex)}`)];
}

export const radiusSetAuthMethod: TypedOperation<RadiusSetAuthMethodInput, RawCommandOutput> = {
  manifestId: "cli.radius.setauthmethod",
  classification: "write",
  buildFrames: buildSetAuthMethodFrames,
  parse: (exchanges) => parseSetAuthMethod(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.client.add -- `radius client add <idx> ...` (rawLine 11570) --
// write
// ---------------------------------------------------------------------------

export interface RadiusClientAddInput {
  readonly index: number;
  readonly ipv4Address?: string;
  readonly ipv4Mask?: string;
  readonly ipv6Prefix?: string;
  readonly ipv6PrefixLength?: number;
  readonly secret?: string;
}

function buildClientAddFrames(input: RadiusClientAddInput): readonly CommandFrame[] {
  assertPositiveClientIndex(input.index);

  const parts: string[] = ["radius", "client", "add", String(input.index)];

  if (input.ipv4Address !== undefined) {
    assertSingleToken(input.ipv4Address, "ipv4Address");
    parts.push(`-i ${input.ipv4Address}`);
  }
  if (input.ipv4Mask !== undefined) {
    assertSingleToken(input.ipv4Mask, "ipv4Mask");
    parts.push(`-m ${input.ipv4Mask}`);
  }
  if (input.ipv6Prefix !== undefined) {
    assertSingleToken(input.ipv6Prefix, "ipv6Prefix");
    parts.push(`-p ${input.ipv6Prefix}`);
  }
  if (input.ipv6PrefixLength !== undefined) {
    assertIntegerInRange(input.ipv6PrefixLength, 0, 128, "ipv6PrefixLength");
    parts.push(`-l ${String(input.ipv6PrefixLength)}`);
  }
  if (input.secret !== undefined) {
    assertSingleToken(input.secret, "secret");
    parts.push(`-s ${input.secret}`);
  }

  if (parts.length === 4) {
    throw new Error("At least one radius client add option must be provided.");
  }

  return [frameSingleCommand(parts.join(" "))];
}

function assertPositiveClientIndex(index: number): void {
  assertInteger(index, "index");
  if (index <= 0) {
    throw new Error(`index must be a positive integer (got ${String(index)}).`);
  }
}

export const radiusClientAdd: TypedOperation<RadiusClientAddInput, RawCommandOutput> = {
  manifestId: "cli.radius.client.add",
  classification: "write",
  buildFrames: buildClientAddFrames,
  parse: (exchanges) => parseClientAdd(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.client.del -- `radius client del <idx>` (rawLine 11570) -- write
// ---------------------------------------------------------------------------

export interface RadiusClientDelInput {
  readonly index: number;
}

function buildClientDelFrames(input: RadiusClientDelInput): readonly CommandFrame[] {
  assertPositiveClientIndex(input.index);
  return [frameSingleCommand(`radius client del ${String(input.index)}`)];
}

export const radiusClientDel: TypedOperation<RadiusClientDelInput, RawCommandOutput> = {
  manifestId: "cli.radius.client.del",
  classification: "write",
  buildFrames: buildClientDelFrames,
  parse: (exchanges) => parseClientDel(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.enabledot1x -- `radius enable_dot1x <0/1>` (rawLine 11570) --
// write
// ---------------------------------------------------------------------------

export interface RadiusEnableDot1xInput {
  readonly enabled: boolean;
}

function buildEnableDot1xFrames(input: RadiusEnableDot1xInput): readonly CommandFrame[] {
  return [frameSingleCommand(`radius enable_dot1x ${input.enabled ? "1" : "0"}`)];
}

export const radiusEnableDot1x: TypedOperation<RadiusEnableDot1xInput, RawCommandOutput> = {
  manifestId: "cli.radius.enabledot1x",
  classification: "write",
  buildFrames: buildEnableDot1xFrames,
  parse: (exchanges) => parseEnableDot1x(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.setdot1xmethod -- `radius set_dot1x_method -e|-d <idx>`
// (rawLine 11570) -- write
// ---------------------------------------------------------------------------

export type RadiusSetDot1xMethodInput =
  | { readonly action: "enable"; readonly methodIndex: 1 | 2 | 3 | 4 }
  | { readonly action: "disable"; readonly methodIndex: 1 | 2 | 3 | 4 };

function buildSetDot1xMethodFrames(input: RadiusSetDot1xMethodInput): readonly CommandFrame[] {
  assertNumberOneOf(input.methodIndex, [1, 2, 3, 4], "methodIndex");
  const flag = input.action === "enable" ? "-e" : "-d";
  return [frameSingleCommand(`radius set_dot1x_method ${flag} ${String(input.methodIndex)}`)];
}

export const radiusSetDot1xMethod: TypedOperation<RadiusSetDot1xMethodInput, RawCommandOutput> = {
  manifestId: "cli.radius.setdot1xmethod",
  classification: "write",
  buildFrames: buildSetDot1xMethodFrames,
  parse: (exchanges) => parseSetDot1xMethod(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.external.view -- `radius external -V` (rawLine 11632) -- read
// ---------------------------------------------------------------------------

function buildExternalViewFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("radius external -V")];
}

export const radiusExternalView: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.radius.external.view",
  classification: "read",
  buildFrames: buildExternalViewFrames,
  parse: (exchanges) => parseExternalView(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.external.viewprofile -- `radius external -v <index>` (rawLine
// 11632) -- read
// ---------------------------------------------------------------------------

export interface RadiusExternalProfileInput {
  readonly profileIndex: number;
}

function buildExternalViewProfileFrames(
  input: RadiusExternalProfileInput,
): readonly CommandFrame[] {
  assertPositiveClientIndexNamed(input.profileIndex, "profileIndex");
  return [frameSingleCommand(`radius external -v ${String(input.profileIndex)}`)];
}

function assertPositiveClientIndexNamed(index: number, name: string): void {
  assertInteger(index, name);
  if (index <= 0) {
    throw new Error(`${name} must be a positive integer (got ${String(index)}).`);
  }
}

export const radiusExternalViewProfile: TypedOperation<
  RadiusExternalProfileInput,
  RawCommandOutput
> = {
  manifestId: "cli.radius.external.viewprofile",
  classification: "read",
  buildFrames: buildExternalViewProfileFrames,
  parse: (exchanges) => parseExternalViewProfile(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.external.log -- `radius external -l <index>` (rawLine 11632) --
// read
// ---------------------------------------------------------------------------

function buildExternalLogFrames(input: RadiusExternalProfileInput): readonly CommandFrame[] {
  assertPositiveClientIndexNamed(input.profileIndex, "profileIndex");
  return [frameSingleCommand(`radius external -l ${String(input.profileIndex)}`)];
}

export const radiusExternalLog: TypedOperation<RadiusExternalProfileInput, RawCommandOutput> = {
  manifestId: "cli.radius.external.log",
  classification: "read",
  buildFrames: buildExternalLogFrames,
  parse: (exchanges) => parseExternalLog(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.external -- remaining configure flags (rawLine 11632) -- write
// ---------------------------------------------------------------------------

const RADIUS_EXTERNAL_FLAGS = [
  "-c",
  "-f",
  "-e",
  "-i",
  "-p",
  "-s",
  "-r",
  "-a",
  "-b",
  "-d",
  "-u",
] as const;

export interface RadiusExternalInput {
  readonly args: readonly string[];
}

function buildExternalFrames(input: RadiusExternalInput): readonly CommandFrame[] {
  assertArgsShape(input.args, "radius external");
  assertKnownFlags(input.args, RADIUS_EXTERNAL_FLAGS, "radius external");
  return [frameSingleCommand(`radius external ${input.args.join(" ")}`)];
}

export const radiusExternal: TypedOperation<RadiusExternalInput, RawCommandOutput> = {
  manifestId: "cli.radius.external",
  classification: "write",
  buildFrames: buildExternalFrames,
  parse: (exchanges) => parseExternal(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.radius.showlocalcer -- `radius show_local_cer` (live-firmware-recon) --
// bare read
// ---------------------------------------------------------------------------

function buildShowLocalCerFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("radius show_local_cer")];
}

export const radiusShowLocalCer: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.radius.showlocalcer",
  classification: "read",
  buildFrames: buildShowLocalCerFrames,
  parse: (exchanges) => parseShowLocalCer(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  radiusShow,
  radiusEnable,
  radiusAuthport,
  radiusSetAuthMethod,
  radiusClientAdd,
  radiusClientDel,
  radiusEnableDot1x,
  radiusSetDot1xMethod,
  radiusExternalView,
  radiusExternalViewProfile,
  radiusExternalLog,
  radiusExternal,
  radiusShowLocalCer,
];
