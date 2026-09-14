/**
 * `dos` domain -- Wave 4 family implementation (`BACKLOG.md` "Wave 4"
 * family task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements all 6 already-classified `cli.dos.*` manifest entries produced
 * by the Part VIII `SPLIT_FAMILIES` split of the `dos` heading (rawLine
 * 812, `classificationBasis: "documented-syntax"`): `cli.dos.v` (read),
 * `cli.dos.a`/`cli.dos.d` (write activate/deactivate), `cli.dos.p.show`/
 * `cli.dos.b.show` (read whitelist/blacklist display), and `cli.dos`
 * (write -- remaining configure flags). Sibling `vigor3912s-mcp` evidence
 * consulted read-only for the five named forms; never imported at runtime.
 *
 * `cli.dos` follows the `ha set`/`mngt snmp` flat `args` allowlist
 * precedent for freely-combinable documented flags (`-s`/`-a`/`-e`/`-d`/
 * `-P`/`-B`/`-o`/`-p`/`-l`/`-f`/`-i`). The split-out `-V`/`-A`/`-D`/
 * `-P show`/`-B show` forms are modelled by their own operations and are
 * deliberately excluded from this allowlist.
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/dos/*.ts`.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseView } from "../internal/parsers/dos/view.js";
import { parseActivate } from "../internal/parsers/dos/activate.js";
import { parseDeactivate } from "../internal/parsers/dos/deactivate.js";
import { parseWhitelistShow } from "../internal/parsers/dos/whitelist-show.js";
import { parseBlacklistShow } from "../internal/parsers/dos/blacklist-show.js";
import { parseConfigure } from "../internal/parsers/dos/configure.js";
import type { RawCommandOutput } from "../internal/parsers/dos/shared.js";

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
// cli.dos.v -- `dos -V` (rawLine 812) -- read
// ---------------------------------------------------------------------------

function buildViewFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("dos -V")];
}

export const dosView: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.dos.v",
  classification: "read",
  buildFrames: buildViewFrames,
  parse: (exchanges) => parseView(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.dos.a -- `dos -A` (rawLine 812) -- write
// ---------------------------------------------------------------------------

function buildActivateFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("dos -A")];
}

export const dosActivate: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.dos.a",
  classification: "write",
  buildFrames: buildActivateFrames,
  parse: (exchanges) => parseActivate(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.dos.d -- `dos -D` (rawLine 812) -- write
// ---------------------------------------------------------------------------

function buildDeactivateFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("dos -D")];
}

export const dosDeactivate: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.dos.d",
  classification: "write",
  buildFrames: buildDeactivateFrames,
  parse: (exchanges) => parseDeactivate(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.dos.p.show -- `dos -P show` (rawLine 812) -- read
// ---------------------------------------------------------------------------

function buildWhitelistShowFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("dos -P show")];
}

export const dosWhitelistShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.dos.p.show",
  classification: "read",
  buildFrames: buildWhitelistShowFrames,
  parse: (exchanges) => parseWhitelistShow(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.dos.b.show -- `dos -B show` (rawLine 812) -- read
// ---------------------------------------------------------------------------

function buildBlacklistShowFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("dos -B show")];
}

export const dosBlacklistShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.dos.b.show",
  classification: "read",
  buildFrames: buildBlacklistShowFrames,
  parse: (exchanges) => parseBlacklistShow(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.dos -- remaining configure flags (rawLine 812) -- write
// ---------------------------------------------------------------------------

const DOS_CONFIGURE_FLAGS = [
  "-s",
  "-a",
  "-e",
  "-d",
  "-P",
  "-B",
  "-o",
  "-p",
  "-l",
  "-f",
  "-i",
] as const;

export interface DosConfigureInput {
  readonly args: readonly string[];
}

function buildConfigureFrames(input: DosConfigureInput): readonly CommandFrame[] {
  assertArgsShape(input.args, "dos");
  assertKnownFlags(input.args, DOS_CONFIGURE_FLAGS, "dos");

  return [frameSingleCommand(`dos ${input.args.join(" ")}`)];
}

export const dosConfigure: TypedOperation<DosConfigureInput, RawCommandOutput> = {
  manifestId: "cli.dos",
  classification: "write",
  buildFrames: buildConfigureFrames,
  parse: (exchanges) => parseConfigure(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  dosView,
  dosActivate,
  dosDeactivate,
  dosWhitelistShow,
  dosBlacklistShow,
  dosConfigure,
];
