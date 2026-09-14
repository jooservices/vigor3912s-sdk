/**
 * `ha` domain -- Wave 4 Item5-ha (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the family's 3 already-classified manifest entries (all via
 * `classificationBasis: "sibling-live-verified"`, cross-checked against
 * `projects/vigor3912s-mcp/src/commands/registry/families/ha.ts`, evidence
 * only, never imported): `cli.ha.set` (write), `cli.ha.show` (read),
 * `cli.ha.status` (read).
 *
 * `ha set [-<command> <parameter>|...]` (rawLine 12262) documents 17
 * independent, freely-combinable flags (`-e`/`-l`/`-M`/`-v`/`-R`/`-p`/`-k`/
 * `-u`/`-m`/`-s`/`-y`/`-c`/`-C`/`-I`/`-h`/`-d`/`-o`) -- the same
 * multi-flag-in-one-line shape as `mngt snmp`/`mngt bfp`
 * (`src/domains/mngt.ts`), so this operation follows that exact precedent:
 * a flat `args: readonly string[]` input, validated for non-empty/
 * no-whitespace tokens and a documented-flag allowlist, joined into one
 * frame -- rather than an invented per-flag discriminated union that would
 * still have to support arbitrary combinations per the heading's own
 * "[...] means you can type in several parameters in one line" note.
 *
 * `ha show -c` / `ha show -g` (rawLine 12336) and `ha status -a|-m <Detail
 * Level>` (rawLine 12373) are each modelled as small discriminated inputs
 * (one canonical frame per documented variant), same convention as
 * `wan.ts`'s `wan vlan`/`wan budget`.
 *
 * Every `buildFrames` validates its input before calling
 * `frameSingleCommand` -- `frameSingleCommand` itself only rejects framing
 * hazards (control chars, shell metacharacters, empty input), it has no
 * notion of a command's own documented argument shape. Validation failures
 * throw a plain `Error` (this family's write scope excludes `src/errors.ts`,
 * so no new `SdkErrorCode` is introduced here).
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/ha/*.ts` (`ARCHITECTURE.md` Item 5's parser signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseHaSet, type HaSetAck } from "../internal/parsers/ha/set.js";
import { parseHaShow, type HaShow } from "../internal/parsers/ha/show.js";
import { parseHaStatus, type HaStatus } from "../internal/parsers/ha/status.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
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

/**
 * Validates that every flag-shaped token (`-x`) in `args` belongs to
 * `allowedFlags`; non-flag tokens (values following a flag, e.g. a key or
 * IP address) are left to `frameSingleCommand`'s injection checks rather
 * than re-validated here -- same YAGNI note as `mngt.ts`'s identical helper.
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

function assertOneOf<T extends string>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => `"${entry}"`).join(", ")} (got "${value}").`,
    );
  }
}

function assertOneOfNumbers(value: number, allowed: readonly number[], name: string): void {
  if (!allowed.includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => String(entry)).join(", ")} (got ${String(value)}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.ha.set -- `ha set [-<command> <parameter>|...]` (rawLine 12262) --
// write.
// ---------------------------------------------------------------------------

const HA_SET_FLAGS = [
  "-e",
  "-l",
  "-M",
  "-v",
  "-R",
  "-p",
  "-k",
  "-u",
  "-m",
  "-s",
  "-y",
  "-c",
  "-C",
  "-I",
  "-h",
  "-d",
  "-o",
] as const;

export interface HaSetInput {
  readonly args: readonly string[];
}

function buildHaSetFrames(input: HaSetInput): readonly CommandFrame[] {
  assertArgsShape(input.args, "ha set");
  assertKnownFlags(input.args, HA_SET_FLAGS, "ha set");

  return [frameSingleCommand(`ha set ${input.args.join(" ")}`)];
}

export const haSet: TypedOperation<HaSetInput, HaSetAck> = {
  manifestId: "cli.ha.set",
  classification: "write",
  buildFrames: buildHaSetFrames,
  parse: (exchanges) => parseHaSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ha.show -- `ha show -c` / `ha show -g` (rawLine 12336) -- read.
// ---------------------------------------------------------------------------

export interface HaShowInput {
  readonly section: "configSync" | "generalSetup";
}

const HA_SHOW_FLAG_BY_SECTION: Record<HaShowInput["section"], string> = {
  configSync: "-c",
  generalSetup: "-g",
};

function buildHaShowFrames(input: HaShowInput): readonly CommandFrame[] {
  assertOneOf(input.section, ["configSync", "generalSetup"], "section");

  return [frameSingleCommand(`ha show ${HA_SHOW_FLAG_BY_SECTION[input.section]}`)];
}

export const haShow: TypedOperation<HaShowInput, HaShow> = {
  manifestId: "cli.ha.show",
  classification: "read",
  buildFrames: buildHaShowFrames,
  parse: (exchanges) => parseHaShow(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ha.status -- `ha status -a <Detail Level>` / `ha status -m <Detail
// Level>` (rawLine 12373) -- read.
// ---------------------------------------------------------------------------

export interface HaStatusInput {
  readonly scope: "allRouters" | "localRouter";
  readonly detailLevel: 0 | 1 | 2;
}

const HA_STATUS_FLAG_BY_SCOPE: Record<HaStatusInput["scope"], string> = {
  allRouters: "-a",
  localRouter: "-m",
};

function buildHaStatusFrames(input: HaStatusInput): readonly CommandFrame[] {
  assertOneOf(input.scope, ["allRouters", "localRouter"], "scope");
  assertOneOfNumbers(input.detailLevel, [0, 1, 2], "detailLevel");

  return [
    frameSingleCommand(
      `ha status ${HA_STATUS_FLAG_BY_SCOPE[input.scope]} ${String(input.detailLevel)}`,
    ),
  ];
}

export const haStatus: TypedOperation<HaStatusInput, HaStatus> = {
  manifestId: "cli.ha.status",
  classification: "read",
  buildFrames: buildHaStatusFrames,
  parse: (exchanges) => parseHaStatus(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [haSet, haShow, haStatus];
