/**
 * `log` domain -- Wave 4 family from the Part VIII `SPLIT_FAMILIES` split of
 * the `Log` heading (`BACKLOG.md` "Wave 4" family task template;
 * `ARCHITECTURE.md` Item 5).
 *
 * Implements the eight bounded single-exchange forms documented as
 * `log [-cfhiptwx?] [-F a|c|f|w]` (rawLine 3984): seven no-argument reads
 * (`-c`/`-f`/`-t`/`-w`/`-p`/`-x`/`-h`) and one write flush (`-F` with
 * target `a|c|f|w`). Basis `documented-syntax`. The Web-Console-only
 * `log -wt` streaming form is intentionally absent from Part VIII and is
 * not modelled here.
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/log/*.ts`.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseC } from "../internal/parsers/log/c.js";
import { parseF } from "../internal/parsers/log/f.js";
import { parseFlush } from "../internal/parsers/log/flush.js";
import { parseH } from "../internal/parsers/log/h.js";
import { parseP } from "../internal/parsers/log/p.js";
import { parseT } from "../internal/parsers/log/t.js";
import { parseW } from "../internal/parsers/log/w.js";
import { parseX } from "../internal/parsers/log/x.js";
import type { RawCommandOutput } from "../internal/parsers/log/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

/**
 * Local construction helper for this family's uniform zero-argument reads
 * (`ARCHITECTURE.md` Item 5 / `show.ts` precedent). Kept local per YAGNI.
 */
function defineReadOperation(options: {
  readonly manifestId: string;
  readonly command: string;
  readonly parse: (stdout: string) => RawCommandOutput;
}): TypedOperation<void, RawCommandOutput> {
  return {
    manifestId: options.manifestId,
    classification: "read",
    buildFrames: () => [frameSingleCommand(options.command)],
    parse: (exchanges) => options.parse(firstExchangeText(exchanges)),
  };
}

const FLUSH_TARGETS = ["a", "c", "f", "w"] as const;

export type LogFlushTarget = (typeof FLUSH_TARGETS)[number];

export interface LogFlushInput {
  /** `-F a|c|f|w`: which log buffer(s) to flush. */
  readonly target: LogFlushTarget;
}

function assertFlushTarget(value: string): asserts value is LogFlushTarget {
  if (!(FLUSH_TARGETS as readonly string[]).includes(value)) {
    throw new Error(
      `target must be one of ${FLUSH_TARGETS.map((entry) => `"${entry}"`).join(", ")} (got "${value}").`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.log.c / .f / .t / .w / .p / .x / .h -- `log -<flag>` (rawLine 3984) --
// read
// ---------------------------------------------------------------------------

export const logC: TypedOperation<void, RawCommandOutput> = defineReadOperation({
  manifestId: "cli.log.c",
  command: "log -c",
  parse: parseC,
});

export const logF: TypedOperation<void, RawCommandOutput> = defineReadOperation({
  manifestId: "cli.log.f",
  command: "log -f",
  parse: parseF,
});

export const logT: TypedOperation<void, RawCommandOutput> = defineReadOperation({
  manifestId: "cli.log.t",
  command: "log -t",
  parse: parseT,
});

export const logW: TypedOperation<void, RawCommandOutput> = defineReadOperation({
  manifestId: "cli.log.w",
  command: "log -w",
  parse: parseW,
});

export const logP: TypedOperation<void, RawCommandOutput> = defineReadOperation({
  manifestId: "cli.log.p",
  command: "log -p",
  parse: parseP,
});

export const logX: TypedOperation<void, RawCommandOutput> = defineReadOperation({
  manifestId: "cli.log.x",
  command: "log -x",
  parse: parseX,
});

export const logH: TypedOperation<void, RawCommandOutput> = defineReadOperation({
  manifestId: "cli.log.h",
  command: "log -h",
  parse: parseH,
});

// ---------------------------------------------------------------------------
// cli.log.F -- `log -F a|c|f|w` (rawLine 3984) -- write
// ---------------------------------------------------------------------------

function buildFlushFrames(input: LogFlushInput): readonly CommandFrame[] {
  assertFlushTarget(input.target);

  return [frameSingleCommand(`log -F ${input.target}`)];
}

export const logFlush: TypedOperation<LogFlushInput, RawCommandOutput> = {
  manifestId: "cli.log.F",
  classification: "write",
  buildFrames: buildFlushFrames,
  parse: (exchanges) => parseFlush(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  logC,
  logF,
  logT,
  logW,
  logP,
  logX,
  logH,
  logFlush,
];
