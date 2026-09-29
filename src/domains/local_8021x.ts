/**
 * `local_8021x` domain -- Wave 4 tiny-family batch (`BACKLOG.md` "Wave 4"
 * family task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the single already-classified `cli.local8021x` manifest entry
 * (rawLine 11727), basis `sibling-live-verified` (`vigor3912s-mcp`'s
 * `src/commands/registry/families/local_8021x.ts`, consulted read-only as
 * evidence, never imported/depended on at runtime). The heading documents
 * four sub-forms -- `local_8021x enable <0/1>`, `local_8021x
 * set_localdot1x_method -e/-d <method_idx>`, and `local_8021x show` -- but
 * the manifest models this heading as one entry classified `read`. Only the
 * documented read sub-form (`local_8021x show`) is modelled here; the
 * `enable`/`set_localdot1x_method` write sub-forms are narrowed out (same
 * pattern as `wan.ts`'s `wanDetect`: the `TypedOperation`'s own
 * `classification` must honestly describe what it does) -- a deliberate
 * YAGNI deferral, not an oversight.
 *
 * `parse` is thin: pulls the first exchange's `stdout` and hands it to a
 * pure `(text: string) => TOutput` parser in
 * `internal/parsers/local_8021x/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseShow, type Local8021xShowReport } from "../internal/parsers/local_8021x/show.js";
import {
  assertCliValue,
  assertIntegerInRange,
  assertOneOf,
  defineCommandOperation,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

// ---------------------------------------------------------------------------
// cli.local8021x -- `local_8021x show` (rawLine 11727) -- read, no arguments
// ---------------------------------------------------------------------------

function buildShowFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("local_8021x show")];
}

export const local8021xShow: TypedOperation<void, Local8021xShowReport> = {
  manifestId: "cli.local8021x",
  classification: "read",
  buildFrames: buildShowFrames,
  parse: (exchanges) => parseShow(firstExchangeText(exchanges)),
};

// `local_8021x enable <0/1>` / `set_localdot1x_method -e|-d <1..4>`
// (rawLine 11727); `cer_set <UID>` / `show_local_cer` from the fw 4.4.7_RC2
// help (`references/live-help-fw-4.4.7_RC2.txt`).
export interface Local8021xEnableInput {
  readonly enabled: boolean;
}

export const local8021xEnable = defineRawOperation<Local8021xEnableInput>(
  "cli.local8021x.enable",
  "write",
  (input) => `local_8021x enable ${input.enabled ? "1" : "0"}`,
);

export interface Local8021xMethodInput {
  readonly action: "set" | "delete";
  /** 1 EAP_PEAP/MSCHAPv2, 2 EAP_TTLS/PAP, 3 EAP_TTLS/MSCHAP, 4 EAP_TTLS/MSCHAPv2. */
  readonly method: number;
}

export const local8021xMethod = defineRawOperation<Local8021xMethodInput>(
  "cli.local8021x.method",
  "write",
  (input) => {
    assertOneOf(input.action, ["set", "delete"], "action");
    assertIntegerInRange(input.method, 1, 4, "method");
    return `local_8021x set_localdot1x_method ${input.action === "set" ? "-e" : "-d"} ${String(input.method)}`;
  },
);

export interface Local8021xCertInput {
  /** Local certificate UID (see `local_8021x show_local_cer`). */
  readonly uid: string;
}

export const local8021xCertSet = defineRawOperation<Local8021xCertInput>(
  "cli.local8021x.cerset",
  "write",
  (input) => {
    assertCliValue(input.uid, "uid");
    return `local_8021x cer_set ${input.uid}`;
  },
);

export const local8021xShowLocalCer = defineCommandOperation(
  "cli.local8021x.showlocalcer",
  "read",
  "local_8021x show_local_cer",
);

export const operations: readonly TypedOperation<never, unknown>[] = [
  local8021xShow,
  local8021xEnable,
  local8021xMethod,
  local8021xCertSet,
  local8021xShowLocalCer,
];
