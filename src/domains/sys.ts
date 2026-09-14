/**
 * `sys` domain — Wave 4 family task Item5-sys.
 *
 * Implements classified `sys` manifest entries, including previously deferred
 * adminuser/board/bonjour/ftpd/iface/sip_alg/rtsp_alg/arp_AutoReq/daylightsave/
 * eap_tls. `cli.sys.admin` remains deferred while still unknown/out of scope.
 *
 * ## `classification: "destructive"` and this file's `TypedOperation`s
 *
 * Two manifest entries implemented here (`cli.sys.reboot`, `cli.sys.cfg.default`)
 * are classified `"destructive"` in the manifest (`src/manifest/types.ts`'s
 * `Classification` union includes `"destructive"`, per `ARCHITECTURE.md`'s
 * 2026-09-13 amendment: destructive commands are classified, not excluded).
 * `internal/registry/operation.ts`'s `TypedOperation.classification`
 * (`OperationClassification`) now also includes `"destructive"`, so both
 * operations below use `classification: "destructive"` directly, matching
 * the manifest. Classification is metadata only — the SDK does not authorize
 * writes; consumers (`LiveReadOnlyClient`, MCP confirm gate, app policy) do.
 */

import { frameSingleCommand } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { SysAck } from "../internal/parsers/sys/ack.js";
import { parseSysAlg } from "../internal/parsers/sys/alg.js";
import { parseSysAutoreboot } from "../internal/parsers/sys/autoreboot.js";
import { parseSysCc, type SysCc } from "../internal/parsers/sys/cc.js";
import { parseSysCfgDefault } from "../internal/parsers/sys/cfg-default.js";
import { parseSysCfgStatus, type SysCfgStatus } from "../internal/parsers/sys/cfg-status.js";
import { parseSysCmdLog, type SysCmdLog } from "../internal/parsers/sys/cmdlog.js";
import { parseSysCommit } from "../internal/parsers/sys/commit.js";
import { parseSysDomainname } from "../internal/parsers/sys/domainname.js";
import { parseSysHealth, type SysHealth } from "../internal/parsers/sys/health.js";
import { parseSysLicense } from "../internal/parsers/sys/license.js";
import { parseSysMailalert } from "../internal/parsers/sys/mailalert.js";
import { parseSysName } from "../internal/parsers/sys/name.js";
import { parseSysPasswd } from "../internal/parsers/sys/passwd.js";
import { parseSysDashboard, type SysDashboard } from "../internal/parsers/sys/dashboard.js";
import { parseSysDnsCacheTbl, type SysDnsCacheTbl } from "../internal/parsers/sys/dnscachetbl.js";
import { parseSysFrLog, type SysFrLog } from "../internal/parsers/sys/frlog.js";
import { parseSysMaxSession, type SysMaxSession } from "../internal/parsers/sys/maxsession.js";
import { parseSysPollbuf, type SysPollbuf } from "../internal/parsers/sys/pollbuf.js";
import { parseSysQryBuf, type SysQryBuf } from "../internal/parsers/sys/qrybuf.js";
import { parseSysReboot } from "../internal/parsers/sys/reboot.js";
import { parseSysSyslog } from "../internal/parsers/sys/syslog.js";
import { parseSysTftpd } from "../internal/parsers/sys/tftpd.js";
import { parseSysTime, type SysTime } from "../internal/parsers/sys/time.js";
import { parseSysTr069 } from "../internal/parsers/sys/tr069.js";
import { parseSysVersion, type SysVersion } from "../internal/parsers/sys/version.js";
import { parseSysWebhook } from "../internal/parsers/sys/webhook.js";
import { parseAdminuser } from "../internal/parsers/sys/adminuser.js";
import { parseBoard } from "../internal/parsers/sys/board.js";
import { parseBonjour } from "../internal/parsers/sys/bonjour.js";
import { parseFtpd } from "../internal/parsers/sys/ftpd.js";
import { parseIface } from "../internal/parsers/sys/iface.js";
import { parseSipAlg } from "../internal/parsers/sys/sip-alg.js";
import { parseRtspAlg } from "../internal/parsers/sys/rtsp-alg.js";
import { parseArpAutoReq } from "../internal/parsers/sys/arp-autoreq.js";
import { parseDaylightsave } from "../internal/parsers/sys/daylightsave.js";
import { parseEapTls } from "../internal/parsers/sys/eap-tls.js";
import { parseSysInfo } from "../internal/parsers/sys/info.js";
import { parseSysAppStatistic } from "../internal/parsers/sys/appstatistic.js";
import { parseSysAppBandwidth } from "../internal/parsers/sys/appbandwidth.js";
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

function assertMaxLength(value: string, max: number, label: string): void {
  if (value.length > max) {
    throw new Error(
      `${label} must be at most ${String(max)} characters (got ${String(value.length)}).`,
    );
  }
}

type WanSelector = "wan1" | "wan2";

function assertWanSelector(value: string, label: string): asserts value is WanSelector {
  if (value !== "wan1" && value !== "wan2") {
    throw new Error(`${label} must be "wan1" or "wan2" (got "${value}").`);
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

function firstExchangeStdout(exchanges: readonly unknown[]): string {
  const first = exchanges[0] as CommandExchange | undefined;
  return first?.stdout ?? "";
}

// ---------------------------------------------------------------------------
// Read-only, no-argument operations.
// ---------------------------------------------------------------------------

const sysCfgStatus: TypedOperation<void, SysCfgStatus> = {
  manifestId: "cli.sys.cfg.status",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys cfg status")],
  parse: (exchanges) => parseSysCfgStatus(firstExchangeStdout(exchanges)),
};

const sysCmdlog: TypedOperation<void, SysCmdLog> = {
  manifestId: "cli.sys.cmdlog",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys cmdlog")],
  parse: (exchanges) => parseSysCmdLog(firstExchangeStdout(exchanges)),
};

const sysCc: TypedOperation<void, SysCc> = {
  manifestId: "cli.sys.cc",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys cc")],
  parse: (exchanges) => parseSysCc(firstExchangeStdout(exchanges)),
};

const sysVersion: TypedOperation<void, SysVersion> = {
  manifestId: "cli.sys.version",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys version")],
  parse: (exchanges) => parseSysVersion(firstExchangeStdout(exchanges)),
};

const sysQrybuf: TypedOperation<void, SysQryBuf> = {
  manifestId: "cli.sys.qrybuf",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys qrybuf")],
  parse: (exchanges) => parseSysQryBuf(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// Sibling-live-verified bare/query reads. PDF may document SET forms; these
// operations frame only the live-observed no-argument query (`vigor3912s-mcp`
// `src/commands/registry/families/sys.ts`, consulted read-only as evidence).
// ---------------------------------------------------------------------------

const sysPollbuf: TypedOperation<void, SysPollbuf> = {
  manifestId: "cli.sys.pollbuf",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys pollbuf")],
  parse: (exchanges) => parseSysPollbuf(firstExchangeStdout(exchanges)),
};

const sysFrlog: TypedOperation<void, SysFrLog> = {
  manifestId: "cli.sys.frlog",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys fr_log")],
  parse: (exchanges) => parseSysFrLog(firstExchangeStdout(exchanges)),
};

const sysDnscachetbl: TypedOperation<void, SysDnsCacheTbl> = {
  manifestId: "cli.sys.dnscachetbl",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys dnsCacheTbl")],
  parse: (exchanges) => parseSysDnsCacheTbl(firstExchangeStdout(exchanges)),
};

const sysTime: TypedOperation<void, SysTime> = {
  manifestId: "cli.sys.time",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys time")],
  parse: (exchanges) => parseSysTime(firstExchangeStdout(exchanges)),
};

const sysDashboard: TypedOperation<void, SysDashboard> = {
  manifestId: "cli.sys.dashboard",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys dashboard")],
  parse: (exchanges) => parseSysDashboard(firstExchangeStdout(exchanges)),
};

const sysMaxsession: TypedOperation<void, SysMaxSession> = {
  manifestId: "cli.sys.maxsession",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys max_session")],
  parse: (exchanges) => parseSysMaxSession(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys health <metric>` — read, one of eight documented metrics.
// ---------------------------------------------------------------------------

export type SysHealthMetric =
  | "cpu_usage"
  | "mem_usage"
  | "arp_status"
  | "dos_status"
  | "sess_usage"
  | "view"
  | "vpn_status"
  | "voip_status";

const SYS_HEALTH_METRICS: readonly SysHealthMetric[] = [
  "cpu_usage",
  "mem_usage",
  "arp_status",
  "dos_status",
  "sess_usage",
  "view",
  "vpn_status",
  "voip_status",
];

export interface SysHealthInput {
  readonly metric: SysHealthMetric;
}

function assertSysHealthMetric(metric: string): asserts metric is SysHealthMetric {
  if (!(SYS_HEALTH_METRICS as readonly string[]).includes(metric)) {
    throw new Error(
      `sys health metric must be one of ${SYS_HEALTH_METRICS.join(", ")} (got "${metric}").`,
    );
  }
}

const sysHealth: TypedOperation<SysHealthInput, SysHealth> = {
  manifestId: "cli.sys.health",
  classification: "read",
  buildFrames: (input) => {
    assertSysHealthMetric(input.metric);
    return [frameSingleCommand(`sys health ${input.metric}`)];
  },
  parse: (exchanges) => parseSysHealth(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys domainname <wan1/wan2> <suffix|clear>` — write.
// ---------------------------------------------------------------------------

export interface SysDomainnameInput {
  readonly wan: WanSelector;
  readonly value: string;
}

const sysDomainname: TypedOperation<SysDomainnameInput, SysAck> = {
  manifestId: "cli.sys.domainname",
  classification: "write",
  buildFrames: (input) => {
    assertWanSelector(input.wan, "sys domainname wan selector");
    if (input.value !== "clear") {
      assertNonEmptyToken(input.value, "sys domainname suffix");
      assertMaxLength(input.value, 39, "sys domainname suffix");
    }
    return [frameSingleCommand(`sys domainname ${input.wan} ${input.value}`)];
  },
  parse: (exchanges) => parseSysDomainname(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys name <wan1/wan2> <name|clear>` — write.
// ---------------------------------------------------------------------------

export interface SysNameInput {
  readonly wan: WanSelector;
  readonly value: string;
}

const sysName: TypedOperation<SysNameInput, SysAck> = {
  manifestId: "cli.sys.name",
  classification: "write",
  buildFrames: (input) => {
    assertWanSelector(input.wan, "sys name wan selector");
    if (input.value !== "clear") {
      assertNonEmptyToken(input.value, "sys name value");
      // The documented body text allows up to 39 characters, but the
      // documented `sys name ?` interactive help text says 20; the smaller
      // bound is used defensively (rawLine 8001).
      assertMaxLength(input.value, 20, "sys name value");
    }
    return [frameSingleCommand(`sys name ${input.wan} ${input.value}`)];
  },
  parse: (exchanges) => parseSysName(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys passwd <old> <new>` — write.
// ---------------------------------------------------------------------------

export interface SysPasswdInput {
  readonly oldPassword: string;
  readonly newPassword: string;
}

const sysPasswd: TypedOperation<SysPasswdInput, SysAck> = {
  manifestId: "cli.sys.passwd",
  classification: "write",
  buildFrames: (input) => {
    assertNonEmptyToken(input.oldPassword, "sys passwd old password");
    assertMaxLength(input.oldPassword, 83, "sys passwd old password");
    assertNonEmptyToken(input.newPassword, "sys passwd new password");
    assertMaxLength(input.newPassword, 83, "sys passwd new password");
    return [frameSingleCommand(`sys passwd ${input.oldPassword} ${input.newPassword}`)];
  },
  parse: (exchanges) => parseSysPasswd(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys reboot` — destructive.
// ---------------------------------------------------------------------------

const sysReboot: TypedOperation<void, SysAck> = {
  manifestId: "cli.sys.reboot",
  classification: "destructive",
  buildFrames: () => [frameSingleCommand("sys reboot")],
  parse: (exchanges) => parseSysReboot(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys autoreboot <on/off/hours>` — write.
// ---------------------------------------------------------------------------

export type SysAutorebootInput = "on" | "off" | { readonly hours: number };

function sysAutorebootCommandArg(input: SysAutorebootInput): string {
  if (input === "on" || input === "off") {
    return input;
  }
  if (!Number.isInteger(input.hours) || input.hours < 1) {
    throw new Error(
      `sys autoreboot hours must be a positive integer (got ${String(input.hours)}).`,
    );
  }
  return String(input.hours);
}

const sysAutoreboot: TypedOperation<SysAutorebootInput, SysAck> = {
  manifestId: "cli.sys.autoreboot",
  classification: "write",
  buildFrames: (input) => [frameSingleCommand(`sys autoreboot ${sysAutorebootCommandArg(input)}`)],
  parse: (exchanges) => parseSysAutoreboot(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys commit` — write.
// ---------------------------------------------------------------------------

const sysCommit: TypedOperation<void, SysAck> = {
  manifestId: "cli.sys.commit",
  classification: "write",
  buildFrames: () => [frameSingleCommand("sys commit")],
  parse: (exchanges) => parseSysCommit(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys tftpd` — write.
// ---------------------------------------------------------------------------

const sysTftpd: TypedOperation<void, SysAck> = {
  manifestId: "cli.sys.tftpd",
  classification: "write",
  buildFrames: () => [frameSingleCommand("sys tftpd")],
  parse: (exchanges) => parseSysTftpd(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys cfg default` — destructive.
// ---------------------------------------------------------------------------

const sysCfgDefault: TypedOperation<void, SysAck> = {
  manifestId: "cli.sys.cfg.default",
  classification: "destructive",
  buildFrames: () => [frameSingleCommand("sys cfg default")],
  parse: (exchanges) => parseSysCfgDefault(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys tr069 <subcommand> [args...]` — write.
// ---------------------------------------------------------------------------

const SYS_TR069_SUBCOMMANDS = [
  "get",
  "set",
  "getnoti",
  "setnoti",
  "log",
  "debug",
  "save",
  "clear",
  "inform",
  "port",
  "cert_auth",
  "only_standard_parm",
  "notify",
] as const;

export interface SysTr069Input {
  readonly args: readonly string[];
}

const sysTr069: TypedOperation<SysTr069Input, SysAck> = {
  manifestId: "cli.sys.tr069",
  classification: "write",
  buildFrames: (input) => {
    assertArgsShape(input.args, "sys tr069");
    const [subcommand] = input.args;
    if (!(SYS_TR069_SUBCOMMANDS as readonly string[]).includes(subcommand ?? "")) {
      throw new Error(
        `sys tr069 subcommand must be one of ${SYS_TR069_SUBCOMMANDS.join(", ")} (got "${subcommand ?? ""}").`,
      );
    }
    return [frameSingleCommand(`sys tr069 ${input.args.join(" ")}`)];
  },
  parse: (exchanges) => parseSysTr069(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys alg -e <0/1>` — write.
// ---------------------------------------------------------------------------

export interface SysAlgInput {
  readonly enabled: boolean;
}

const sysAlg: TypedOperation<SysAlgInput, SysAck> = {
  manifestId: "cli.sys.alg",
  classification: "write",
  buildFrames: (input) => [frameSingleCommand(`sys alg -e ${input.enabled ? "1" : "0"}`)],
  parse: (exchanges) => parseSysAlg(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys license <subcommand> [args...]` — write.
// ---------------------------------------------------------------------------

const SYS_LICENSE_SUBCOMMANDS = [
  "reset_regser",
  "licera",
  "licifno",
  "licalias",
  "lic_trigger",
  "liclog",
] as const;

export interface SysLicenseInput {
  readonly args: readonly string[];
}

const sysLicense: TypedOperation<SysLicenseInput, SysAck> = {
  manifestId: "cli.sys.license",
  classification: "write",
  buildFrames: (input) => {
    assertArgsShape(input.args, "sys license");
    const [subcommand] = input.args;
    if (!(SYS_LICENSE_SUBCOMMANDS as readonly string[]).includes(subcommand ?? "")) {
      throw new Error(
        `sys license subcommand must be one of ${SYS_LICENSE_SUBCOMMANDS.join(", ")} (got "${subcommand ?? ""}").`,
      );
    }
    return [frameSingleCommand(`sys license ${input.args.join(" ")}`)];
  },
  parse: (exchanges) => parseSysLicense(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys syslog -a <0/1> [-<flag> <param> | ...]` — write.
// ---------------------------------------------------------------------------

export interface SysSyslogInput {
  readonly args: readonly string[];
}

const sysSyslog: TypedOperation<SysSyslogInput, SysAck> = {
  manifestId: "cli.sys.syslog",
  classification: "write",
  buildFrames: (input) => {
    assertArgsShape(input.args, "sys syslog");
    const [flag, value] = input.args;
    if (flag !== "-a") {
      throw new Error(
        `sys syslog requires "-a <0/1>" as its first two arguments (got "${flag ?? ""}").`,
      );
    }
    if (value !== "0" && value !== "1") {
      throw new Error(`sys syslog -a value must be "0" or "1" (got "${value ?? ""}").`);
    }
    return [frameSingleCommand(`sys syslog ${input.args.join(" ")}`)];
  },
  parse: (exchanges) => parseSysSyslog(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys mailalert [-<flag> <param>]` — write.
// ---------------------------------------------------------------------------

const SYS_MAILALERT_FLAG_PATTERN = /^-[A-Za-z]$/;

export interface SysMailalertInput {
  readonly args: readonly string[];
}

const sysMailalert: TypedOperation<SysMailalertInput, SysAck> = {
  manifestId: "cli.sys.mailalert",
  classification: "write",
  buildFrames: (input) => {
    for (const [index, token] of input.args.entries()) {
      assertNonEmptyToken(token, `sys mailalert argument #${String(index + 1)}`);
    }
    if (input.args.length > 0 && !SYS_MAILALERT_FLAG_PATTERN.test(input.args[0] ?? "")) {
      throw new Error(`sys mailalert's first argument must be a single-letter flag (e.g. "-e").`);
    }
    const command =
      input.args.length > 0 ? `sys mailalert ${input.args.join(" ")}` : "sys mailalert";
    return [frameSingleCommand(command)];
  },
  parse: (exchanges) => parseSysMailalert(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `sys webhook <enable|send|status|url|period> [args...]` — write.
// ---------------------------------------------------------------------------

const SYS_WEBHOOK_SUBCOMMANDS = ["enable", "send", "status", "url", "period"] as const;

export interface SysWebhookInput {
  readonly args: readonly string[];
}

const sysWebhook: TypedOperation<SysWebhookInput, SysAck> = {
  manifestId: "cli.sys.webhook",
  classification: "write",
  buildFrames: (input) => {
    assertArgsShape(input.args, "sys webhook");
    const [subcommand] = input.args;
    if (!(SYS_WEBHOOK_SUBCOMMANDS as readonly string[]).includes(subcommand ?? "")) {
      throw new Error(
        `sys webhook subcommand must be one of ${SYS_WEBHOOK_SUBCOMMANDS.join(", ")} (got "${subcommand ?? ""}").`,
      );
    }
    return [frameSingleCommand(`sys webhook ${input.args.join(" ")}`)];
  },
  parse: (exchanges) => parseSysWebhook(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// Domain export convention (`internal/registry/self-assembly.ts`): exactly
// `export const operations: readonly TypedOperation<never, unknown>[]`.
// ---------------------------------------------------------------------------

function assertIntegerInRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(
      `${label} must be an integer between ${String(min)} and ${String(max)} (got ${String(value)}).`,
    );
  }
}

function assertOneOfString<T extends string>(
  value: string,
  allowed: readonly T[],
  label: string,
): asserts value is T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")} (got "${value}").`);
  }
}

// ---------------------------------------------------------------------------
// cli.sys.adminuser -- YAGNI: Local/LDAP/TACACS+/fallback toggles only
// (edit/delete/view deferred).
// ---------------------------------------------------------------------------

export type SysAdminuserInput = {
  readonly target: "Local" | "LDAP" | "TACACS+" | "fallback";
  readonly enabled: boolean;
};

export const sysAdminuser: TypedOperation<SysAdminuserInput, SysAck> = {
  manifestId: "cli.sys.adminuser",
  classification: "write",
  buildFrames: (input) => {
    assertOneOfString(input.target, ["Local", "LDAP", "TACACS+", "fallback"], "target");

    return [frameSingleCommand(`sys adminuser ${input.target} ${input.enabled ? "1" : "0"}`)];
  },
  parse: (exchanges) => parseAdminuser(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.sys.board -- YAGNI: documented example forms.
// ---------------------------------------------------------------------------

export type SysBoardInput =
  | {
      readonly target: "buttonDef" | "buttonWlan" | "ledControl" | "ledSleepMode";
      readonly enabled: boolean;
    }
  | { readonly target: "ledSleepModeTime"; readonly minutes: number }
  | { readonly target: "usb"; readonly port: "p1" | "p2"; readonly enabled: boolean };

export const sysBoard: TypedOperation<SysBoardInput, SysAck> = {
  manifestId: "cli.sys.board",
  classification: "write",
  buildFrames: (input) => {
    switch (input.target) {
      case "buttonDef":
        return [frameSingleCommand(`sys board button def ${input.enabled ? "on" : "off"}`)];
      case "buttonWlan":
        return [frameSingleCommand(`sys board button wlan ${input.enabled ? "on" : "off"}`)];
      case "ledControl":
        return [frameSingleCommand(`sys board led control ${input.enabled ? "on" : "off"}`)];
      case "ledSleepMode":
        return [frameSingleCommand(`sys board led sleepMode ${input.enabled ? "on" : "off"}`)];
      case "ledSleepModeTime":
        assertIntegerInRange(input.minutes, 1, 1440, "minutes");

        return [frameSingleCommand(`sys board led sleepMode time ${String(input.minutes)}`)];
      case "usb":
        assertOneOfString(input.port, ["p1", "p2"], "port");

        return [frameSingleCommand(`sys board usb ${input.port} ${input.enabled ? "on" : "off"}`)];
    }
  },
  parse: (exchanges) => parseBoard(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.sys.bonjour -- flag subset from documented syntax table.
// ---------------------------------------------------------------------------

export interface SysBonjourInput {
  readonly serviceEnabled?: boolean;
  readonly httpEnabled?: boolean;
  readonly telnetEnabled?: boolean;
  readonly ftpEnabled?: boolean;
  readonly sshEnabled?: boolean;
  readonly printerEnabled?: boolean;
  readonly ipv6Enabled?: boolean;
}

export const sysBonjour: TypedOperation<SysBonjourInput, SysAck> = {
  manifestId: "cli.sys.bonjour",
  classification: "write",
  buildFrames: (input) => {
    const parts = ["sys bonjour"];

    if (input.serviceEnabled !== undefined) parts.push(`-e ${input.serviceEnabled ? "1" : "0"}`);
    if (input.httpEnabled !== undefined) parts.push(`-h ${input.httpEnabled ? "1" : "0"}`);
    if (input.telnetEnabled !== undefined) parts.push(`-t ${input.telnetEnabled ? "1" : "0"}`);
    if (input.ftpEnabled !== undefined) parts.push(`-f ${input.ftpEnabled ? "1" : "0"}`);
    if (input.sshEnabled !== undefined) parts.push(`-s ${input.sshEnabled ? "1" : "0"}`);
    if (input.printerEnabled !== undefined) parts.push(`-p ${input.printerEnabled ? "1" : "0"}`);
    if (input.ipv6Enabled !== undefined) parts.push(`-6 ${input.ipv6Enabled ? "1" : "0"}`);

    if (parts.length === 1) {
      throw new Error("At least one sys bonjour option must be provided.");
    }

    return [frameSingleCommand(parts.join(" "))];
  },
  parse: (exchanges) => parseBonjour(firstExchangeStdout(exchanges)),
};

export interface SysFtpdInput {
  readonly enabled: boolean;
}

export const sysFtpd: TypedOperation<SysFtpdInput, SysAck> = {
  manifestId: "cli.sys.ftpd",
  classification: "write",
  buildFrames: (input) => [frameSingleCommand(`sys ftpd ${input.enabled ? "on" : "off"}`)],
  parse: (exchanges) => parseFtpd(firstExchangeStdout(exchanges)),
};

export const sysIface: TypedOperation<void, SysAck> = {
  manifestId: "cli.sys.iface",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys iface")],
  parse: (exchanges) => parseIface(firstExchangeStdout(exchanges)),
};

export interface SysSipAlgInput {
  readonly enabled?: boolean;
  readonly port?: number;
  readonly udpPathEnabled?: boolean;
  readonly tcpPathEnabled?: boolean;
}

export const sysSipAlg: TypedOperation<SysSipAlgInput, SysAck> = {
  manifestId: "cli.sys.sipalg",
  classification: "write",
  buildFrames: (input) => {
    const parts = ["sys sip_alg"];

    if (input.enabled !== undefined) parts.push(`-e ${input.enabled ? "1" : "0"}`);
    if (input.port !== undefined) {
      assertIntegerInRange(input.port, 1, 65535, "port");
      parts.push(`-p ${String(input.port)}`);
    }
    if (input.udpPathEnabled !== undefined) parts.push(`-u ${input.udpPathEnabled ? "1" : "0"}`);
    if (input.tcpPathEnabled !== undefined) parts.push(`-t ${input.tcpPathEnabled ? "1" : "0"}`);

    if (parts.length === 1) {
      throw new Error("At least one sys sip_alg option must be provided.");
    }

    return [frameSingleCommand(parts.join(" "))];
  },
  parse: (exchanges) => parseSipAlg(firstExchangeStdout(exchanges)),
};

export interface SysRtspAlgInput {
  readonly enabled?: boolean;
  readonly port?: number;
  readonly udpPathEnabled?: boolean;
  readonly tcpPathEnabled?: boolean;
  readonly showPortmap?: boolean;
}

export const sysRtspAlg: TypedOperation<SysRtspAlgInput, SysAck> = {
  manifestId: "cli.sys.rtspalg",
  classification: "write",
  buildFrames: (input) => {
    const parts = ["sys rtsp_alg"];

    if (input.enabled !== undefined) parts.push(`-e ${input.enabled ? "1" : "0"}`);
    if (input.port !== undefined) {
      assertIntegerInRange(input.port, 1, 65535, "port");
      parts.push(`-p ${String(input.port)}`);
    }
    if (input.udpPathEnabled !== undefined) parts.push(`-u ${input.udpPathEnabled ? "1" : "0"}`);
    if (input.tcpPathEnabled !== undefined) parts.push(`-t ${input.tcpPathEnabled ? "1" : "0"}`);
    if (input.showPortmap === true) parts.push("-v");

    if (parts.length === 1) {
      throw new Error("At least one sys rtsp_alg option must be provided.");
    }

    return [frameSingleCommand(parts.join(" "))];
  },
  parse: (exchanges) => parseRtspAlg(firstExchangeStdout(exchanges)),
};

export interface SysArpAutoReqInput {
  readonly enabled: boolean;
}

export const sysArpAutoReq: TypedOperation<SysArpAutoReqInput, SysAck> = {
  manifestId: "cli.sys.arpautoreq",
  classification: "write",
  // Documented encoding: `-d 0` enables, `-d 1` disables.
  buildFrames: (input) => [frameSingleCommand(`sys arp_AutoReq -d ${input.enabled ? "0" : "1"}`)],
  parse: (exchanges) => parseArpAutoReq(firstExchangeStdout(exchanges)),
};

export interface SysDaylightsaveInput {
  readonly enabled?: boolean;
  readonly show?: boolean;
  readonly reset?: boolean;
}

export const sysDaylightsave: TypedOperation<SysDaylightsaveInput, SysAck> = {
  manifestId: "cli.sys.daylightsave",
  classification: "write",
  buildFrames: (input) => {
    const parts = ["sys daylightsave"];

    if (input.show === true) parts.push("-v");
    if (input.reset === true) parts.push("-r");
    if (input.enabled !== undefined) parts.push(`-e ${input.enabled ? "1" : "0"}`);

    if (parts.length === 1) {
      throw new Error("At least one sys daylightsave option must be provided.");
    }

    return [frameSingleCommand(parts.join(" "))];
  },
  parse: (exchanges) => parseDaylightsave(firstExchangeStdout(exchanges)),
};

export interface SysEapTlsInput {
  readonly enabled: boolean;
}

export const sysEapTls: TypedOperation<SysEapTlsInput, SysAck> = {
  manifestId: "cli.sys.eaptls",
  classification: "write",
  buildFrames: (input) => [frameSingleCommand(`sys eap_tls set ${input.enabled ? "1" : "0"}`)],
  parse: (exchanges) => parseEapTls(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// Sibling-live-verified bare reads (live-firmware-recon).
// ---------------------------------------------------------------------------

export const sysInfo: TypedOperation<void, SysAck> = {
  manifestId: "cli.sys.info",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys info")],
  parse: (exchanges) => parseSysInfo(firstExchangeStdout(exchanges)),
};

export const sysAppStatistic: TypedOperation<void, SysAck> = {
  manifestId: "cli.sys.appstatistic",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys app_statistic")],
  parse: (exchanges) => parseSysAppStatistic(firstExchangeStdout(exchanges)),
};

export const sysAppBandwidth: TypedOperation<void, SysAck> = {
  manifestId: "cli.sys.appbandwidth",
  classification: "read",
  buildFrames: () => [frameSingleCommand("sys app_bandwidth")],
  parse: (exchanges) => parseSysAppBandwidth(firstExchangeStdout(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  sysCfgStatus,
  sysCfgDefault,
  sysCmdlog,
  sysDomainname,
  sysName,
  sysPasswd,
  sysReboot,
  sysAutoreboot,
  sysCommit,
  sysTftpd,
  sysCc,
  sysVersion,
  sysQrybuf,
  sysPollbuf,
  sysFrlog,
  sysDnscachetbl,
  sysTime,
  sysDashboard,
  sysMaxsession,
  sysTr069,
  sysHealth,
  sysAlg,
  sysLicense,
  sysSyslog,
  sysMailalert,
  sysWebhook,
  sysAdminuser,
  sysBoard,
  sysBonjour,
  sysFtpd,
  sysIface,
  sysSipAlg,
  sysRtspAlg,
  sysArpAutoReq,
  sysDaylightsave,
  sysEapTls,
  sysInfo,
  sysAppStatistic,
  sysAppBandwidth,
];

/** Still-deferred unknown entry outside this task's documented set. */
export const deferredUnknownSysIds = ["cli.sys.admin"] as const;
