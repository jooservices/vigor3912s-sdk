/**
 * `show` domain module (Wave 4, `Item5-show`) -- classified `cli.show.*`
 * manifest entries. Per `internal/registry/self-assembly.ts`'s binding
 * export convention, this module's required export is `operations`.
 *
 * All commands are simple no-argument read commands
 * (`commandPath: ["show", <name>]`, `command: "show <name>"` with no
 * arguments in the manifest), so every operation shares the same
 * zero-argument `TInput = never` shape and issues exactly one
 * `frameSingleCommand(...)` frame. There is no caller-controlled input for
 * any of these operations, so there is no injection surface to defend
 * against beyond framing's own rejection rules (proven in this module's
 * tests).
 */

import { frameSingleCommand } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import { parseShowClientTraffic } from "../internal/parsers/show/clienttraffic.js";
import { parseShowCocpu } from "../internal/parsers/show/cocpu.js";
import { parseShowCpu } from "../internal/parsers/show/cpu.js";
import { parseShowCputemp } from "../internal/parsers/show/cputemp.js";
import { parseShowDmz } from "../internal/parsers/show/dmz.js";
import { parseShowDns } from "../internal/parsers/show/dns.js";
import { parseShowFlow } from "../internal/parsers/show/flow.js";
import { parseShowLan } from "../internal/parsers/show/lan.js";
import { parseShowMemory } from "../internal/parsers/show/memory.js";
import { parseShowNat } from "../internal/parsers/show/nat.js";
import { parseShowOpenport } from "../internal/parsers/show/openport.js";
import { parseShowPmtime } from "../internal/parsers/show/pmtime.js";
import { parseShowPortmap } from "../internal/parsers/show/portmap.js";
import { parseShowQryrdsl } from "../internal/parsers/show/qryrdsl.js";
import { parseShowSession } from "../internal/parsers/show/session.js";
import { parseShowStatistic } from "../internal/parsers/show/statistic.js";
import { parseShowStatus } from "../internal/parsers/show/status.js";
import { parseShowTraffic } from "../internal/parsers/show/traffic.js";
import { parseShowVoip } from "../internal/parsers/show/voip.js";
import type { TypedOperation } from "../internal/registry/operation.js";

/** Reads the first exchange's `stdout`, tolerating a missing/malformed exchange. */
function firstStdout(exchanges: readonly unknown[]): string {
  const first = exchanges[0] as CommandExchange | undefined;
  return first?.stdout ?? "";
}

/**
 * Single construction point for this domain's operations
 * (`ARCHITECTURE.md` Item 5: "`defineOperation` is the single construction
 * point for every typed operation"). No shared helper existed yet across
 * domains, so this is a small, local one scoped to `show`'s uniform
 * zero-argument shape -- kept minimal per YAGNI rather than generalized for
 * hypothetical future domains.
 */
function defineOperation<TOutput>(options: {
  readonly manifestId: string;
  readonly command: string;
  readonly parse: (stdout: string) => TOutput;
}): TypedOperation<never, TOutput> {
  return {
    manifestId: options.manifestId,
    classification: "read",
    buildFrames: () => [frameSingleCommand(options.command)],
    parse: (exchanges) => options.parse(firstStdout(exchanges)),
  };
}

export const operations: readonly TypedOperation<never, unknown>[] = [
  defineOperation({
    manifestId: "cli.show.lan",
    command: "show lan",
    parse: parseShowLan,
  }),
  defineOperation({
    manifestId: "cli.show.dmz",
    command: "show dmz",
    parse: parseShowDmz,
  }),
  defineOperation({
    manifestId: "cli.show.dns",
    command: "show dns",
    parse: parseShowDns,
  }),
  defineOperation({
    manifestId: "cli.show.openport",
    command: "show openport",
    parse: parseShowOpenport,
  }),
  defineOperation({
    manifestId: "cli.show.nat",
    command: "show nat",
    parse: parseShowNat,
  }),
  defineOperation({
    manifestId: "cli.show.portmap",
    command: "show portmap",
    parse: parseShowPortmap,
  }),
  defineOperation({
    manifestId: "cli.show.pmtime",
    command: "show pmtime",
    parse: parseShowPmtime,
  }),
  defineOperation({
    manifestId: "cli.show.session",
    command: "show session",
    parse: parseShowSession,
  }),
  defineOperation({
    manifestId: "cli.show.status",
    command: "show status",
    parse: parseShowStatus,
  }),
  defineOperation({
    manifestId: "cli.show.traffic",
    command: "show traffic",
    parse: parseShowTraffic,
  }),
  defineOperation({
    manifestId: "cli.show.clienttraffic",
    command: "show clienttraffic",
    parse: parseShowClientTraffic,
  }),
  defineOperation({
    manifestId: "cli.show.statistic",
    command: "show statistic",
    parse: parseShowStatistic,
  }),
  defineOperation({
    manifestId: "cli.show.cpu",
    command: "show cpu",
    parse: parseShowCpu,
  }),
  defineOperation({
    manifestId: "cli.show.memory",
    command: "show memory",
    parse: parseShowMemory,
  }),
  defineOperation({
    manifestId: "cli.show.cocpu",
    command: "show cocpu",
    parse: parseShowCocpu,
  }),
  defineOperation({
    manifestId: "cli.show.cputemp",
    command: "show cputemp",
    parse: parseShowCputemp,
  }),
  defineOperation({
    manifestId: "cli.show.flow",
    command: "show flow",
    parse: parseShowFlow,
  }),
  defineOperation({
    manifestId: "cli.show.voip",
    command: "show voip",
    parse: parseShowVoip,
  }),
  defineOperation({
    manifestId: "cli.show.qryrdsl",
    command: "show qryrdsl",
    parse: parseShowQryrdsl,
  }),
];
