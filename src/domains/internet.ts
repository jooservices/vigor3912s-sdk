/**
 * `internet` domain -- Wave 4 family implementation (`BACKLOG.md` "Wave 4"
 * family task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements both already-classified `cli.internet.*` manifest entries from
 * the Part VIII `SPLIT_FAMILIES` split of the `Internet` heading (rawLine
 * 908, commandPath slug `internet`): `cli.internet.v` (read, `-V`) and
 * `cli.internet` (write, `-W`/`-M`/...). Basis `documented-syntax`;
 * sibling `vigor3912s-mcp` consulted read-only as evidence.
 *
 * The write operation models the documented example flags (`-W`, `-M`,
 * `-S`, `-P`, `-u`, `-p`, `-a`, `-t`, `-i`, `-w`, `-n`, `-g`, `-s`,
 * `-A`, `-B`) with `-M` mandatory per the heading's own syntax line.
 * `-V` is owned by `cli.internet.v` and is deliberately excluded here.
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/internet/*.ts`.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseView } from "../internal/parsers/internet/view.js";
import { parseSet } from "../internal/parsers/internet/set.js";
import type { RawCommandOutput } from "../internal/parsers/internet/shared.js";

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
  // Never interpolate `value` into the message — callers use this for
  // password/username tokens; echoing rejected secrets would leak into Error.message.
  if (!SINGLE_CLI_TOKEN_PATTERN.test(value)) {
    throw new Error(`${name} must be a single non-empty token with no whitespace.`);
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
// cli.internet.v -- `internet -V` (rawLine 908) -- read
// ---------------------------------------------------------------------------

function buildViewFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("internet -V")];
}

export const internetView: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.internet.v",
  classification: "read",
  buildFrames: buildViewFrames,
  parse: (exchanges) => parseView(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.internet -- `internet -W n -M n [-<command> <parameter> | ...]`
// (rawLine 908) -- write
// ---------------------------------------------------------------------------

export interface InternetSetInput {
  /** `-W n`: WAN interface. Default WAN1 when omitted. */
  readonly wanInterface?: number;
  /** `-M n`: Internet Access Mode (0-7). Mandatory. */
  readonly mode: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** `-S <isp name>`: ISP name (max 23 characters). */
  readonly ispName?: string;
  /** `-P <on/off>`: Enable PPPoE Service. */
  readonly pppoeService?: "on" | "off";
  /** `-u <username>`: username (max 49 characters). */
  readonly username?: string;
  /** `-p <password>`: password (max 49 characters). */
  readonly password?: string;
  /** `-a n`: PPP Authentication Type (0 PAP/CHAP, 1 PAP Only). */
  readonly pppAuthType?: 0 | 1;
  /** `-t n`: connection duration (-1 Always-on, 1-999 idle seconds). */
  readonly idleTimeout?: number;
  /** `-i <ip address>`: PPPoE-assigned CPE IP (0.0.0.0 = dynamic). */
  readonly pppoeClientIp?: string;
  /** `-w <ip address>`: WAN IP address. */
  readonly wanIp?: string;
  /** `-n <netmask>`: WAN netmask. */
  readonly wanNetmask?: string;
  /** `-g <gateway>`: gateway IP. */
  readonly gateway?: string;
  /** `-s <server ip>`: PPTP/L2TP server IP. */
  readonly serverIp?: string;
  /** `-A <idx>`: Always On mode backup WAN#. */
  readonly alwaysOnBackupWan?: number;
  /** `-B <mode>`: Backup mode (0 any WAN disconnect, 1 all WAN disconnect). */
  readonly backupMode?: 0 | 1;
}

function buildSetFrames(input: InternetSetInput): readonly CommandFrame[] {
  assertNumberOneOf(input.mode, [0, 1, 2, 3, 4, 5, 6, 7], "mode");

  const parts: string[] = ["internet"];

  if (input.wanInterface !== undefined) {
    assertIntegerInRange(input.wanInterface, 1, 12, "wanInterface");
    parts.push(`-W ${String(input.wanInterface)}`);
  }

  parts.push(`-M ${String(input.mode)}`);

  if (input.ispName !== undefined) {
    assertSingleToken(input.ispName, "ispName");
    if (input.ispName.length > 23) {
      throw new Error(
        `ispName must be at most 23 characters (got ${String(input.ispName.length)}).`,
      );
    }
    parts.push(`-S ${input.ispName}`);
  }

  if (input.pppoeService !== undefined) {
    assertOneOf(input.pppoeService, ["on", "off"], "pppoeService");
    parts.push(`-P ${input.pppoeService}`);
  }

  if (input.username !== undefined) {
    assertSingleToken(input.username, "username");
    if (input.username.length > 49) {
      throw new Error(
        `username must be at most 49 characters (got ${String(input.username.length)}).`,
      );
    }
    parts.push(`-u ${input.username}`);
  }

  if (input.password !== undefined) {
    assertSingleToken(input.password, "password");
    if (input.password.length > 49) {
      throw new Error(
        `password must be at most 49 characters (got ${String(input.password.length)}).`,
      );
    }
    parts.push(`-p ${input.password}`);
  }

  if (input.pppAuthType !== undefined) {
    assertNumberOneOf(input.pppAuthType, [0, 1], "pppAuthType");
    parts.push(`-a ${String(input.pppAuthType)}`);
  }

  if (input.idleTimeout !== undefined) {
    if (input.idleTimeout !== -1) {
      assertIntegerInRange(input.idleTimeout, 1, 999, "idleTimeout");
    }
    parts.push(`-t ${String(input.idleTimeout)}`);
  }

  if (input.pppoeClientIp !== undefined) {
    assertSingleToken(input.pppoeClientIp, "pppoeClientIp");
    parts.push(`-i ${input.pppoeClientIp}`);
  }

  if (input.wanIp !== undefined) {
    assertSingleToken(input.wanIp, "wanIp");
    parts.push(`-w ${input.wanIp}`);
  }

  if (input.wanNetmask !== undefined) {
    assertSingleToken(input.wanNetmask, "wanNetmask");
    parts.push(`-n ${input.wanNetmask}`);
  }

  if (input.gateway !== undefined) {
    assertSingleToken(input.gateway, "gateway");
    parts.push(`-g ${input.gateway}`);
  }

  if (input.serverIp !== undefined) {
    assertSingleToken(input.serverIp, "serverIp");
    parts.push(`-s ${input.serverIp}`);
  }

  if (input.alwaysOnBackupWan !== undefined) {
    assertIntegerInRange(input.alwaysOnBackupWan, 1, 12, "alwaysOnBackupWan");
    parts.push(`-A ${String(input.alwaysOnBackupWan)}`);
  }

  if (input.backupMode !== undefined) {
    assertNumberOneOf(input.backupMode, [0, 1], "backupMode");
    parts.push(`-B ${String(input.backupMode)}`);
  }

  return [frameSingleCommand(parts.join(" "))];
}

export const internetSet: TypedOperation<InternetSetInput, RawCommandOutput> = {
  manifestId: "cli.internet",
  classification: "write",
  buildFrames: buildSetFrames,
  parse: (exchanges) => parseSet(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [internetView, internetSet];
