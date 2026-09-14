/**
 * `tacacsplus` domain -- Wave 4 family task `tacacsplus` (`BACKLOG.md`
 * "Wave 4" family task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements both already-classified `cli.tacacsplus.*` manifest entries
 * assigned to this task:
 *
 * - `cli.tacacsplus.set` (rawLine 4121, write) -- `tacacsplus set <Options>
 *   <Value>`, one of five documented flag variants (`-e`, `-i`, `-p`, `-s`,
 *   `-C`), modelled as a discriminated `action` union input, one canonical
 *   frame per variant -- still exactly one `TypedOperation` per manifest
 *   entry, not an invented extra command (same pattern as `wan vlan`/`wan
 *   budget` in `src/domains/wan.ts`).
 * - `cli.tacacsplus.view` (rawLine 4152, read) -- `tacacsplus view`, no
 *   arguments.
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
 * `internal/parsers/tacacsplus/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseSet } from "../internal/parsers/tacacsplus/set.js";
import { parseView, type TacacsplusStatusReport } from "../internal/parsers/tacacsplus/view.js";
import type { RawCommandOutput } from "../internal/parsers/tacacsplus/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

/** Both TACACS+ server slots the documented `<INDEX>` argument addresses ("0 for primary server; 1 for secondary server", rawLine 4121). */
function assertServerIndex(value: number, name: string): void {
  if (value !== 0 && value !== 1) {
    throw new Error(
      `${name} must be 0 (primary server) or 1 (secondary server) (got ${String(value)}).`,
    );
  }
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

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function assertIpv4(value: string, name: string): void {
  if (!IPV4_PATTERN.test(value)) {
    throw new Error(`${name} must be a valid IPv4 address (got "${value}").`);
  }
}

function assertNonEmptyNoQuotes(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }

  if (value.includes('"')) {
    throw new Error(`${name} must not contain a double-quote character.`);
  }
}

// ---------------------------------------------------------------------------
// cli.tacacsplus.set -- `tacacsplus set <Options><Value>` (rawLine 4121) --
// write. Five documented flag variants: `-e <0-1>`, `-i "<INDEX><IP>"`,
// `-p "<INDEX><port>"`, `-s "<INDEX><secret>"`, `-C <yes>`.
// ---------------------------------------------------------------------------

export type TacacsplusSetInput =
  | { readonly action: "enable"; readonly enabled: boolean }
  | { readonly action: "serverIp"; readonly serverIndex: 0 | 1; readonly ipAddress: string }
  | { readonly action: "serverPort"; readonly serverIndex: 0 | 1; readonly port: number }
  | { readonly action: "sharedSecret"; readonly serverIndex: 0 | 1; readonly secret: string }
  | { readonly action: "clear" };

function buildSetFrames(input: TacacsplusSetInput): readonly CommandFrame[] {
  switch (input.action) {
    case "enable": {
      return [frameSingleCommand(`tacacsplus set -e ${input.enabled ? "1" : "0"}`)];
    }
    case "serverIp": {
      assertServerIndex(input.serverIndex, "serverIndex");
      assertIpv4(input.ipAddress, "ipAddress");

      return [
        frameSingleCommand(`tacacsplus set -i "${String(input.serverIndex)} ${input.ipAddress}"`),
      ];
    }
    case "serverPort": {
      assertServerIndex(input.serverIndex, "serverIndex");
      assertIntegerInRange(input.port, 1, 65535, "port");

      return [
        frameSingleCommand(
          `tacacsplus set -p "${String(input.serverIndex)} ${String(input.port)}"`,
        ),
      ];
    }
    case "sharedSecret": {
      assertServerIndex(input.serverIndex, "serverIndex");
      assertNonEmptyNoQuotes(input.secret, "secret");

      return [
        frameSingleCommand(`tacacsplus set -s "${String(input.serverIndex)} ${input.secret}"`),
      ];
    }
    case "clear": {
      return [frameSingleCommand("tacacsplus set -C yes")];
    }
  }
}

export const tacacsplusSet: TypedOperation<TacacsplusSetInput, RawCommandOutput> = {
  manifestId: "cli.tacacsplus.set",
  classification: "write",
  buildFrames: buildSetFrames,
  parse: (exchanges) => parseSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.tacacsplus.view -- `tacacsplus view` (rawLine 4152) -- read.
// ---------------------------------------------------------------------------

function buildViewFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("tacacsplus view")];
}

export const tacacsplusView: TypedOperation<void, TacacsplusStatusReport> = {
  manifestId: "cli.tacacsplus.view",
  classification: "read",
  buildFrames: buildViewFrames,
  parse: (exchanges) => parseView(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  tacacsplusSet,
  tacacsplusView,
];
