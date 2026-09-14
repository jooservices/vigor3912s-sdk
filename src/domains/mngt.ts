/**
 * `mngt` domain — Wave 4 family task Item5-mngt.
 *
 * Implements classified `mngt` manifest entries including previously deferred
 * `cli.mngt.certimport` and `cli.mngt.ip6iids`.
 *
 * ## `classification: "destructive"` and this file's `TypedOperation`s
 *
 * One manifest entry implemented here (`cli.mngt.rmtcfg.enable`) is
 * classified `"destructive"` in the manifest (`src/manifest/types.ts`'s
 * `Classification` union includes `"destructive"`, per `ARCHITECTURE.md`'s
 * 2026-09-13 amendment: destructive commands are classified, not excluded —
 * `mngt rmtcfg enable` is one of `operations.md`'s four "never run"
 * commands, because it exposes management to the Internet).
 * `internal/registry/operation.ts`'s `TypedOperation.classification`
 * (`OperationClassification`) now also includes `"destructive"`, so
 * `mngtRmtcfgEnable` below uses `classification: "destructive"` directly,
 * matching the manifest. Classification is metadata only — the SDK does not
 * authorize writes; consumers own policy. This operation is never invoked
 * against a live router from SDK tests (fake transport only).
 */

import { frameSingleCommand } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import { parseMngtAck, type MngtAck } from "../internal/parsers/mngt/ack.js";
import { parseMngtTimeoutAck, type MngtTimeoutAck } from "../internal/parsers/mngt/timeout.js";
import { parseCertImport } from "../internal/parsers/mngt/cert-import.js";
import { parseIp6Iids } from "../internal/parsers/mngt/ip6-iids.js";
import type { TypedOperation } from "../internal/registry/operation.js";

// ---------------------------------------------------------------------------
// Shared, local (non-shared-file) validation helpers.
//
// These reject malformed *argument shapes* before a command string is ever
// built. They deliberately do NOT re-check for control characters or shell
// metacharacters (`;`, `&`, `|`, backtick, `$(`) — that injection-protection
// logic already lives in `frameSingleCommand` (`internal/execution/framing.ts`)
// and every `buildFrames` below still routes its constructed string through
// it unconditionally, so injection attempts are still rejected, just not by
// duplicated logic here.
// ---------------------------------------------------------------------------

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

/**
 * TCP/UDP port bound (1-65535). The documented syntax for every `mngt
 * *port` command only states "type the number for <X> port" plus its
 * default value — no vendor-specified range. `1-65535` is the standard
 * TCP/UDP port range, used here as an engineering-default input-shape bound
 * (same spirit as `ARCHITECTURE.md` Item 3's engineering-default execution
 * limits), not an invented vendor limit.
 */
function assertPortNumber(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${label} must be an integer between 1 and 65535 (got ${String(value)}).`);
  }
}

/** Documented range for `mngt telnettimeout`/`mngt sshtimeout`: 60-300 (rawLine 4573/4584). */
function assertTimeoutSeconds(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 60 || value > 300) {
    throw new Error(`${label} must be an integer between 60 and 300 (got ${String(value)}).`);
  }
}

function assertOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  label: string,
): asserts value is T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")} (got "${value}").`);
  }
}

/**
 * Validates that every flag-shaped token (`-x`) in `args` belongs to
 * `allowedFlags`; non-flag tokens (values following a flag, e.g. an IP
 * address or community name) are left to `frameSingleCommand`'s injection
 * checks rather than re-validated here (YAGNI — the documented flag syntax
 * for `mngt lanaccess`/`mngt snmp`/`mngt bfp` does not constrain value
 * shapes beyond "a proper name/number").
 */
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

function firstExchangeStdout(exchanges: readonly unknown[]): string {
  const first = exchanges[0] as CommandExchange | undefined;
  return first?.stdout ?? "";
}

// ---------------------------------------------------------------------------
// `mngt ftpport|httpport|httpsport|sslvpnport|telnetport|sshport <port>` —
// write, six numeric-port operations sharing one command builder shape.
// ---------------------------------------------------------------------------

export interface MngtPortInput {
  readonly port: number;
}

function definePortOperation(
  manifestId: string,
  commandWord: string,
  label: string,
): TypedOperation<MngtPortInput, MngtAck> {
  return {
    manifestId,
    classification: "write",
    buildFrames: (input) => {
      assertPortNumber(input.port, label);
      return [frameSingleCommand(`mngt ${commandWord} ${String(input.port)}`)];
    },
    parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
  };
}

const mngtFtpport = definePortOperation("cli.mngt.ftpport", "ftpport", "mngt ftpport port");
const mngtHttpport = definePortOperation("cli.mngt.httpport", "httpport", "mngt httpport port");
const mngtHttpsport = definePortOperation("cli.mngt.httpsport", "httpsport", "mngt httpsport port");
const mngtSslvpnport = definePortOperation(
  "cli.mngt.sslvpnport",
  "sslvpnport",
  "mngt sslvpnport port",
);
const mngtTelnetport = definePortOperation(
  "cli.mngt.telnetport",
  "telnetport",
  "mngt telnetport port",
);
const mngtSshport = definePortOperation("cli.mngt.sshport", "sshport", "mngt sshport port");

// ---------------------------------------------------------------------------
// `mngt noping <on|off|viewlog|clearlog>` — write.
// ---------------------------------------------------------------------------

export type MngtNopingAction = "on" | "off" | "viewlog" | "clearlog";

const MNGT_NOPING_ACTIONS: readonly MngtNopingAction[] = ["on", "off", "viewlog", "clearlog"];

export interface MngtNopingInput {
  readonly action: MngtNopingAction;
}

const mngtNoping: TypedOperation<MngtNopingInput, MngtAck> = {
  manifestId: "cli.mngt.noping",
  classification: "write",
  buildFrames: (input) => {
    assertOneOf(input.action, MNGT_NOPING_ACTIONS, "mngt noping action");
    return [frameSingleCommand(`mngt noping ${input.action}`)];
  },
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt defenseworm <on|off|viewlog|clearlog|add <port>|del <port>>` — write.
// ---------------------------------------------------------------------------

export type MngtDefenseWormInput =
  | { readonly action: "on" | "off" | "viewlog" | "clearlog" }
  | { readonly action: "add" | "del"; readonly port: number };

const MNGT_DEFENSEWORM_SIMPLE_ACTIONS = ["on", "off", "viewlog", "clearlog"] as const;

const mngtDefenseworm: TypedOperation<MngtDefenseWormInput, MngtAck> = {
  manifestId: "cli.mngt.defenseworm",
  classification: "write",
  buildFrames: (input) => {
    if (input.action === "add" || input.action === "del") {
      assertPortNumber(input.port, "mngt defenseworm port");
      return [frameSingleCommand(`mngt defenseworm ${input.action} ${String(input.port)}`)];
    }
    assertOneOf(input.action, MNGT_DEFENSEWORM_SIMPLE_ACTIONS, "mngt defenseworm action");
    return [frameSingleCommand(`mngt defenseworm ${input.action}`)];
  },
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt rmtcfg status` — read, no arguments.
// ---------------------------------------------------------------------------

const mngtRmtcfgStatus: TypedOperation<void, MngtAck> = {
  manifestId: "cli.mngt.rmtcfg.status",
  classification: "read",
  buildFrames: () => [frameSingleCommand("mngt rmtcfg status")],
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt rmtcfg enable` — destructive. Exposes management to the Internet;
// SDK tests only exercise it via fake transport. Live/router policy is
// consumer-owned (not an SDK ChangePlan / verifier — removed 2026-09-14).
// ---------------------------------------------------------------------------

const mngtRmtcfgEnable: TypedOperation<void, MngtAck> = {
  manifestId: "cli.mngt.rmtcfg.enable",
  classification: "destructive",
  buildFrames: () => [frameSingleCommand("mngt rmtcfg enable")],
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt rmtcfg disable` — write.
// ---------------------------------------------------------------------------

const mngtRmtcfgDisable: TypedOperation<void, MngtAck> = {
  manifestId: "cli.mngt.rmtcfg.disable",
  classification: "write",
  buildFrames: () => [frameSingleCommand("mngt rmtcfg disable")],
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt rmtcfg <protocol> on|off` — write, templated protocol + boolean.
// ---------------------------------------------------------------------------

export type MngtRmtcfgProtocol =
  "http" | "https" | "ftp" | "telnet" | "ssh" | "tr069" | "snmp" | "enforce_https";

const MNGT_RMTCFG_PROTOCOLS: readonly MngtRmtcfgProtocol[] = [
  "http",
  "https",
  "ftp",
  "telnet",
  "ssh",
  "tr069",
  "snmp",
  "enforce_https",
];

export type MngtRmtcfgOnOff = "on" | "off";

const MNGT_RMTCFG_ON_OFF: readonly MngtRmtcfgOnOff[] = ["on", "off"];

export interface MngtRmtcfgProtocolInput {
  readonly protocol: MngtRmtcfgProtocol;
  readonly onOff: MngtRmtcfgOnOff;
}

const mngtRmtcfgProtocol: TypedOperation<MngtRmtcfgProtocolInput, MngtAck> = {
  manifestId: "cli.mngt.rmtcfg.protocol",
  classification: "write",
  buildFrames: (input) => {
    assertOneOf(input.protocol, MNGT_RMTCFG_PROTOCOLS, "mngt rmtcfg protocol");
    assertOneOf(input.onOff, MNGT_RMTCFG_ON_OFF, "mngt rmtcfg on/off value");
    return [frameSingleCommand(`mngt rmtcfg ${input.protocol} ${input.onOff}`)];
  },
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt lanaccess [-<flag> <param> | ...]` — write.
// ---------------------------------------------------------------------------

const MNGT_LANACCESS_FLAGS = ["-e", "-s", "-i", "-I", "-E", "-f", "-d", "-v", "-h"] as const;

export interface MngtLanaccessInput {
  readonly args: readonly string[];
}

const mngtLanaccess: TypedOperation<MngtLanaccessInput, MngtAck> = {
  manifestId: "cli.mngt.lanaccess",
  classification: "write",
  buildFrames: (input) => {
    assertArgsShape(input.args, "mngt lanaccess");
    assertKnownFlags(input.args, MNGT_LANACCESS_FLAGS, "mngt lanaccess");
    return [frameSingleCommand(`mngt lanaccess ${input.args.join(" ")}`)];
  },
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt echoicmp <enable|disable>` — write.
// ---------------------------------------------------------------------------

export type MngtEchoIcmpAction = "enable" | "disable";

const MNGT_ECHOICMP_ACTIONS: readonly MngtEchoIcmpAction[] = ["enable", "disable"];

export interface MngtEchoIcmpInput {
  readonly action: MngtEchoIcmpAction;
}

const mngtEchoicmp: TypedOperation<MngtEchoIcmpInput, MngtAck> = {
  manifestId: "cli.mngt.echoicmp",
  classification: "write",
  buildFrames: (input) => {
    assertOneOf(input.action, MNGT_ECHOICMP_ACTIONS, "mngt echoicmp action");
    return [frameSingleCommand(`mngt echoicmp ${input.action}`)];
  },
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt accesslist <list|add|remove|flush> [args...]` — write.
// ---------------------------------------------------------------------------

const MNGT_ACCESSLIST_SUBCOMMANDS = ["list", "add", "remove", "flush"] as const;

export interface MngtAccesslistInput {
  readonly args: readonly string[];
}

const mngtAccesslist: TypedOperation<MngtAccesslistInput, MngtAck> = {
  manifestId: "cli.mngt.accesslist",
  classification: "write",
  buildFrames: (input) => {
    assertArgsShape(input.args, "mngt accesslist");
    const [subcommand] = input.args;
    assertOneOf(subcommand ?? "", MNGT_ACCESSLIST_SUBCOMMANDS, "mngt accesslist subcommand");
    return [frameSingleCommand(`mngt accesslist ${input.args.join(" ")}`)];
  },
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt wanlogin <enable|disable>` — write.
// ---------------------------------------------------------------------------

export type MngtWanloginAction = "enable" | "disable";

const MNGT_WANLOGIN_ACTIONS: readonly MngtWanloginAction[] = ["enable", "disable"];

export interface MngtWanloginInput {
  readonly action: MngtWanloginAction;
}

const mngtWanlogin: TypedOperation<MngtWanloginInput, MngtAck> = {
  manifestId: "cli.mngt.wanlogin",
  classification: "write",
  buildFrames: (input) => {
    assertOneOf(input.action, MNGT_WANLOGIN_ACTIONS, "mngt wanlogin action");
    return [frameSingleCommand(`mngt wanlogin ${input.action}`)];
  },
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt snmp [-<command> <parameter> | ...]` — write.
// ---------------------------------------------------------------------------

const MNGT_SNMP_FLAGS = [
  "-e",
  "-a",
  "-b",
  "-c",
  "-g",
  "-s",
  "-m",
  "-t",
  "-n",
  "-T",
  "-o",
  "-p",
  "-q",
  "-r",
  "-u",
  "-V",
] as const;

export interface MngtSnmpInput {
  readonly args: readonly string[];
}

const mngtSnmp: TypedOperation<MngtSnmpInput, MngtAck> = {
  manifestId: "cli.mngt.snmp",
  classification: "write",
  buildFrames: (input) => {
    assertArgsShape(input.args, "mngt snmp");
    assertKnownFlags(input.args, MNGT_SNMP_FLAGS, "mngt snmp");
    return [frameSingleCommand(`mngt snmp ${input.args.join(" ")}`)];
  },
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt bfp [<command> <parameter> | ...]` — write.
// ---------------------------------------------------------------------------

const MNGT_BFP_FLAGS = ["-e", "-s", "-l", "-p", "-v"] as const;

export interface MngtBfpInput {
  readonly args: readonly string[];
}

const mngtBfp: TypedOperation<MngtBfpInput, MngtAck> = {
  manifestId: "cli.mngt.bfp",
  classification: "write",
  buildFrames: (input) => {
    assertArgsShape(input.args, "mngt bfp");
    assertKnownFlags(input.args, MNGT_BFP_FLAGS, "mngt bfp");
    return [frameSingleCommand(`mngt bfp ${input.args.join(" ")}`)];
  },
  parse: (exchanges) => parseMngtAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `mngt telnettimeout <value>` / `mngt sshtimeout <value>` — write, documented
// range 60-300 (rawLine 4573/4584).
// ---------------------------------------------------------------------------

export interface MngtTimeoutInput {
  readonly seconds: number;
}

const mngtTelnettimeout: TypedOperation<MngtTimeoutInput, MngtTimeoutAck> = {
  manifestId: "cli.mngt.telnettimeout",
  classification: "write",
  buildFrames: (input) => {
    assertTimeoutSeconds(input.seconds, "mngt telnettimeout seconds");
    return [frameSingleCommand(`mngt telnettimeout ${String(input.seconds)}`)];
  },
  parse: (exchanges) => parseMngtTimeoutAck(firstExchangeStdout(exchanges)),
};

const mngtSshtimeout: TypedOperation<MngtTimeoutInput, MngtTimeoutAck> = {
  manifestId: "cli.mngt.sshtimeout",
  classification: "write",
  buildFrames: (input) => {
    assertTimeoutSeconds(input.seconds, "mngt sshtimeout seconds");
    return [frameSingleCommand(`mngt sshtimeout ${String(input.seconds)}`)];
  },
  parse: (exchanges) => parseMngtTimeoutAck(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// Domain export convention (`internal/registry/self-assembly.ts`): exactly
// `export const operations: readonly TypedOperation<never, unknown>[]`.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// cli.mngt.certimport -- `mngt cert_import local_cert|trusted_ca ...`
// (rawLine 4553) -- write.
// ---------------------------------------------------------------------------

export type MngtCertImportInput =
  | { readonly kind: "local_cert"; readonly url: string; readonly password: string }
  | { readonly kind: "trusted_ca"; readonly url: string };

function buildCertImportFrames(input: MngtCertImportInput) {
  assertNonEmptyToken(input.url, "url");

  if (input.kind === "local_cert") {
    assertNonEmptyToken(input.password, "password");

    return [frameSingleCommand(`mngt cert_import local_cert ${input.url} ${input.password}`)];
  }

  return [frameSingleCommand(`mngt cert_import trusted_ca ${input.url}`)];
}

export const mngtCertImport: TypedOperation<MngtCertImportInput, MngtAck> = {
  manifestId: "cli.mngt.certimport",
  classification: "write",
  buildFrames: buildCertImportFrames,
  parse: (exchanges) => parseCertImport(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.mngt.ip6iids -- `mngt ip6_IIDs -e|-r|-s` (rawLine 4599) -- write.
// ---------------------------------------------------------------------------

export type MngtIp6IidsInput =
  | { readonly action: "setMode"; readonly mode: 0 | 1 }
  | { readonly action: "regenerate"; readonly iface: string }
  | { readonly action: "show" };

const ALLOWED_IP6_IIDS_MODES = [0, 1] as const;

function buildIp6IidsFrames(input: MngtIp6IidsInput) {
  switch (input.action) {
    case "setMode": {
      // Runtime membership (not a direct `!== 0 && !== 1`) so plain-JS /
      // cast callers are rejected without tripping
      // `@typescript-eslint/no-unnecessary-condition` on the 0|1 literal type.
      if (!(ALLOWED_IP6_IIDS_MODES as readonly number[]).includes(input.mode)) {
        throw new Error(`mode must be one of 0, 1 (got ${String(input.mode)}).`);
      }

      return [frameSingleCommand(`mngt ip6_IIDs -e ${String(input.mode)}`)];
    }
    case "regenerate": {
      assertNonEmptyToken(input.iface, "iface");

      return [frameSingleCommand(`mngt ip6_IIDs -r ${input.iface}`)];
    }
    case "show": {
      return [frameSingleCommand("mngt ip6_IIDs -s")];
    }
  }
}

export const mngtIp6Iids: TypedOperation<MngtIp6IidsInput, MngtAck> = {
  manifestId: "cli.mngt.ip6iids",
  classification: "write",
  buildFrames: buildIp6IidsFrames,
  parse: (exchanges) => parseIp6Iids(firstExchangeStdout(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  mngtFtpport,
  mngtHttpport,
  mngtHttpsport,
  mngtSslvpnport,
  mngtTelnetport,
  mngtSshport,
  mngtNoping,
  mngtDefenseworm,
  mngtRmtcfgStatus,
  mngtRmtcfgEnable,
  mngtRmtcfgDisable,
  mngtRmtcfgProtocol,
  mngtLanaccess,
  mngtEchoicmp,
  mngtAccesslist,
  mngtWanlogin,
  mngtSnmp,
  mngtBfp,
  mngtTelnettimeout,
  mngtSshtimeout,
  mngtCertImport,
  mngtIp6Iids,
];
