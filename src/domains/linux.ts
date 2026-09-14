/**
 * `linux` domain — Wave 4 family task Item5-linux.
 *
 * Implements classified `cli.linux.*` entries including previously deferred
 * telnet service forms and ring subcommands (rawLine 12969). Ring argument
 * payloads beyond the bare subcommand token are undocumented and deferred.
 *
 * ## `classification: "destructive"` and this file's `TypedOperation`s
 *
 * Two manifest entries implemented here (`cli.linux.clean.o`,
 * `cli.linux.clean.w`) are classified `"destructive"` in the manifest
 * (`src/manifest/types.ts`'s `Classification` union includes `"destructive"`,
 * per `ARCHITECTURE.md`'s 2026-09-13 amendment: destructive commands are
 * classified, not excluded). `internal/registry/operation.ts`'s
 * `TypedOperation.classification` (`OperationClassification`) now also
 * includes `"destructive"`, so both operations below use `classification:
 * "destructive"` directly, matching the manifest. They are never invoked
 * against anything real, per this task's explicit instruction; every test
 * below uses `tests/support/fake-transport.ts` only.
 *
 * ## `linux setlinuxip`'s password argument
 *
 * `-p <admin pw>` is a real, necessary argument the router needs, so it must
 * appear in the single `CommandFrame` this operation builds (there is no way
 * to send it otherwise) — that is expected, not a leak. What must never
 * happen is the password appearing anywhere *else*: no validation-error
 * message embeds it (`assertNonEmptyToken`/`assertMaxLength` below only ever
 * interpolate a field label, never a field value), `frameSingleCommand`'s own
 * rejection messages are generic and never echo the rejected command text
 * (`internal/execution/framing.ts`), and nothing under this file or its
 * parsers logs, prints, or re-throws the constructed command string. See
 * `tests/domains/linux/setlinuxip.test.ts` for the proving test.
 */

import { frameSingleCommand } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import { parseCleanA } from "../internal/parsers/linux/clean-a.js";
import { parseCleanB } from "../internal/parsers/linux/clean-b.js";
import { parseCleanD } from "../internal/parsers/linux/clean-d.js";
import { parseCleanO } from "../internal/parsers/linux/clean-o.js";
import { parseCleanW } from "../internal/parsers/linux/clean-w.js";
import { parseServiceSshDisable } from "../internal/parsers/linux/service-ssh-disable.js";
import { parseServiceSshEnable } from "../internal/parsers/linux/service-ssh-enable.js";
import { parseServiceSshSetport } from "../internal/parsers/linux/service-ssh-setport.js";
import { parseServiceSshStatus } from "../internal/parsers/linux/service-ssh-status.js";
import { parseServiceTelnetDisable } from "../internal/parsers/linux/service-telnet-disable.js";
import { parseServiceTelnetEnable } from "../internal/parsers/linux/service-telnet-enable.js";
import { parseServiceTelnetSetport } from "../internal/parsers/linux/service-telnet-setport.js";
import { parseServiceTelnetStatus } from "../internal/parsers/linux/service-telnet-status.js";
import { parseRingSet } from "../internal/parsers/linux/ring-set.js";
import { parseRingSend } from "../internal/parsers/linux/ring-send.js";
import { parseRingClean } from "../internal/parsers/linux/ring-clean.js";
import { parseRingTest } from "../internal/parsers/linux/ring-test.js";
import { parseRingDebug } from "../internal/parsers/linux/ring-debug.js";
import { parseSetLinuxIp } from "../internal/parsers/linux/setlinuxip.js";
import type { LinuxAck, LinuxToggleStatus } from "../internal/parsers/linux/shared.js";
import { parseLinuxStatus, type LinuxStatusResult } from "../internal/parsers/linux/status.js";
import { parseSyslogDisable } from "../internal/parsers/linux/syslog-disable.js";
import { parseSyslogEnable } from "../internal/parsers/linux/syslog-enable.js";
import { parseSyslogStatus } from "../internal/parsers/linux/syslog-status.js";
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

function assertIntegerInRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be an integer between ${String(min)} and ${String(max)}.`);
  }
}

function firstExchangeStdout(exchanges: readonly unknown[]): string {
  const first = exchanges[0] as CommandExchange | undefined;
  return first?.stdout ?? "";
}

// ---------------------------------------------------------------------------
// `linux status` — read, no argument. `liveReadOnlyAllowlist` id.
// ---------------------------------------------------------------------------

const linuxStatus: TypedOperation<void, LinuxStatusResult> = {
  manifestId: "cli.linux.status",
  classification: "read",
  buildFrames: () => [frameSingleCommand("linux status")],
  parse: (exchanges) => parseLinuxStatus(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `linux setlinuxip -i <IP> -c <CIDR> -g <GW> [v VLANx] [-p <admin pw>]` — write.
//
// Only `ip` is documented as necessary; `cidr` (default 24, range 1-32),
// `gateway` (default 0.0.0.0), `vlan` (default 0, range 0-99), and
// `password` (first-time setting only) are documented as optional.
// ---------------------------------------------------------------------------

export interface SetLinuxIpInput {
  readonly ip: string;
  readonly cidr?: number;
  readonly gateway?: string;
  readonly vlan?: number;
  readonly password?: string;
}

const setLinuxIp: TypedOperation<SetLinuxIpInput, LinuxAck> = {
  manifestId: "cli.linux.setlinuxip",
  classification: "write",
  buildFrames: (input) => {
    assertNonEmptyToken(input.ip, "linux setlinuxip IP");

    const parts = ["linux", "setlinuxip", "-i", input.ip];

    if (input.cidr !== undefined) {
      assertIntegerInRange(input.cidr, 1, 32, "linux setlinuxip CIDR");
      parts.push("-c", String(input.cidr));
    }

    if (input.gateway !== undefined) {
      assertNonEmptyToken(input.gateway, "linux setlinuxip gateway");
      parts.push("-g", input.gateway);
    }

    if (input.vlan !== undefined) {
      assertIntegerInRange(input.vlan, 0, 99, "linux setlinuxip VLAN");
      // Documented literally as `v VLANx` (no leading `-`), unlike every
      // other flag in this command's syntax -- matched verbatim rather than
      // "corrected" to `-v`, per this task's "match documented syntax" basis.
      parts.push("v", String(input.vlan));
    }

    if (input.password !== undefined) {
      assertNonEmptyToken(input.password, "linux setlinuxip password");
      // Real, necessary argument -- must appear in the frame (see module doc
      // comment). Never echoed anywhere else: `assertNonEmptyToken` above
      // only interpolates the field label, never `input.password` itself.
      parts.push("-p", input.password);
    }

    return [frameSingleCommand(parts.join(" "))];
  },
  parse: (exchanges) => parseSetLinuxIp(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `linux service ssh enable|disable|status|setport <port>` — mixed.
// ---------------------------------------------------------------------------

const serviceSshEnable: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.service.ssh.enable",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux service ssh enable")],
  parse: (exchanges) => parseServiceSshEnable(firstExchangeStdout(exchanges)),
};

const serviceSshDisable: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.service.ssh.disable",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux service ssh disable")],
  parse: (exchanges) => parseServiceSshDisable(firstExchangeStdout(exchanges)),
};

const serviceSshStatus: TypedOperation<void, LinuxToggleStatus> = {
  manifestId: "cli.linux.service.ssh.status",
  classification: "read",
  buildFrames: () => [frameSingleCommand("linux service ssh status")],
  parse: (exchanges) => parseServiceSshStatus(firstExchangeStdout(exchanges)),
};

export interface ServiceSshSetportInput {
  readonly port: number;
}

const serviceSshSetport: TypedOperation<ServiceSshSetportInput, LinuxAck> = {
  manifestId: "cli.linux.service.ssh.setport",
  classification: "write",
  buildFrames: (input) => {
    assertIntegerInRange(input.port, 1, 65535, "linux service ssh setport port");
    return [frameSingleCommand(`linux service ssh setport ${String(input.port)}`)];
  },
  parse: (exchanges) => parseServiceSshSetport(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `linux syslog enable|disable|status` — mixed.
// ---------------------------------------------------------------------------

const syslogEnable: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.syslog.enable",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux syslog enable")],
  parse: (exchanges) => parseSyslogEnable(firstExchangeStdout(exchanges)),
};

const syslogDisable: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.syslog.disable",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux syslog disable")],
  parse: (exchanges) => parseSyslogDisable(firstExchangeStdout(exchanges)),
};

const syslogStatus: TypedOperation<void, LinuxToggleStatus> = {
  manifestId: "cli.linux.syslog.status",
  classification: "read",
  buildFrames: () => [frameSingleCommand("linux syslog status")],
  parse: (exchanges) => parseSyslogStatus(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `linux clean -a/-b/-d/-o/-w` — write (`-o`/`-w` destructive; see module doc
// comment above for the classification mapping).
// Never invoked against anything real; every test uses a fake transport.
// ---------------------------------------------------------------------------

const cleanA: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.clean.a",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux clean -a")],
  parse: (exchanges) => parseCleanA(firstExchangeStdout(exchanges)),
};

const cleanB: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.clean.b",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux clean -b")],
  parse: (exchanges) => parseCleanB(firstExchangeStdout(exchanges)),
};

const cleanD: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.clean.d",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux clean -d")],
  parse: (exchanges) => parseCleanD(firstExchangeStdout(exchanges)),
};

// `linux clean -o` — destructive.
const cleanO: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.clean.o",
  classification: "destructive",
  buildFrames: () => [frameSingleCommand("linux clean -o")],
  parse: (exchanges) => parseCleanO(firstExchangeStdout(exchanges)),
};

// `linux clean -w` — destructive.
const cleanW: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.clean.w",
  classification: "destructive",
  buildFrames: () => [frameSingleCommand("linux clean -w")],
  parse: (exchanges) => parseCleanW(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `linux service telnet enable|disable|status|setport` — mirrors ssh forms.
// ---------------------------------------------------------------------------

export const linuxServiceTelnetEnable: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.service.telnet.enable",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux service telnet enable")],
  parse: (exchanges) => parseServiceTelnetEnable(firstExchangeStdout(exchanges)),
};

export const linuxServiceTelnetDisable: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.service.telnet.disable",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux service telnet disable")],
  parse: (exchanges) => parseServiceTelnetDisable(firstExchangeStdout(exchanges)),
};

export const linuxServiceTelnetStatus: TypedOperation<void, LinuxToggleStatus> = {
  manifestId: "cli.linux.service.telnet.status",
  classification: "read",
  buildFrames: () => [frameSingleCommand("linux service telnet status")],
  parse: (exchanges) => parseServiceTelnetStatus(firstExchangeStdout(exchanges)),
};

export interface ServiceTelnetSetportInput {
  readonly port: number;
}

export const linuxServiceTelnetSetport: TypedOperation<ServiceTelnetSetportInput, LinuxAck> = {
  manifestId: "cli.linux.service.telnet.setport",
  classification: "write",
  buildFrames: (input) => {
    assertIntegerInRange(input.port, 1, 65535, "linux service telnet setport port");

    return [frameSingleCommand(`linux service telnet setport ${String(input.port)}`)];
  },
  parse: (exchanges) => parseServiceTelnetSetport(firstExchangeStdout(exchanges)),
};

// ---------------------------------------------------------------------------
// `linux ring <set|send|clean|test|debug>` — bare tokens only (rawLine 12969).
// Extra ring payloads are undocumented and deliberately deferred (YAGNI).
// ---------------------------------------------------------------------------

export const linuxRingSet: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.ring.set",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux ring set")],
  parse: (exchanges) => parseRingSet(firstExchangeStdout(exchanges)),
};

export const linuxRingSend: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.ring.send",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux ring send")],
  parse: (exchanges) => parseRingSend(firstExchangeStdout(exchanges)),
};

export const linuxRingClean: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.ring.clean",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux ring clean")],
  parse: (exchanges) => parseRingClean(firstExchangeStdout(exchanges)),
};

export const linuxRingTest: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.ring.test",
  classification: "write",
  buildFrames: () => [frameSingleCommand("linux ring test")],
  parse: (exchanges) => parseRingTest(firstExchangeStdout(exchanges)),
};

export const linuxRingDebug: TypedOperation<void, LinuxAck> = {
  manifestId: "cli.linux.ring.debug",
  classification: "read",
  buildFrames: () => [frameSingleCommand("linux ring debug")],
  parse: (exchanges) => parseRingDebug(firstExchangeStdout(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  linuxStatus,
  setLinuxIp,
  serviceSshEnable,
  serviceSshDisable,
  serviceSshStatus,
  serviceSshSetport,
  syslogEnable,
  syslogDisable,
  syslogStatus,
  cleanA,
  cleanB,
  cleanD,
  cleanO,
  cleanW,
  linuxServiceTelnetEnable,
  linuxServiceTelnetDisable,
  linuxServiceTelnetStatus,
  linuxServiceTelnetSetport,
  linuxRingSet,
  linuxRingSend,
  linuxRingClean,
  linuxRingTest,
  linuxRingDebug,
];
