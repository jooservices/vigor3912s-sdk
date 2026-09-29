/**
 * `service` domain -- Wave 4 tiny-family batch (`BACKLOG.md` "Wave 4" family
 * task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the single already-classified `cli.service` manifest entry
 * (rawLine 13038), basis `sibling-live-verified` (`vigor3912s-mcp`'s
 * `src/commands/registry/families/service.ts`, consulted read-only as
 * evidence, never imported/depended on at runtime), classified `read`. The
 * heading documents six sub-forms -- `service -s` (display status), `-r`
 * (refresh), `-l <account> <password>` (login/transfer), `-i <new_owner>
 * <new_owner_email>` (set transfer target), `-t <yes>/<no>` (transfer
 * ownership), `-c` (clear owner) -- only `service -s`, the documented
 * read-only status display, is modelled here (same narrowing pattern as
 * `wan.ts`'s `wanDetect`); the `-r`/`-l`/`-i`/`-t`/`-c` mutating sub-forms
 * are a deliberate YAGNI deferral.
 *
 * `parse` is thin: pulls the first exchange's `stdout` and hands it to a
 * pure `(text: string) => TOutput` parser in `internal/parsers/service/*.ts`
 * (`ARCHITECTURE.md` Item 5's parser signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseStatus } from "../internal/parsers/service/status.js";
import type { RawCommandOutput } from "../internal/parsers/service/shared.js";
import {
  assertCliValue,
  defineCommandOperation,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

// ---------------------------------------------------------------------------
// cli.service -- `service -s` (rawLine 13038) -- read, no arguments
// ---------------------------------------------------------------------------

function buildStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("service -s")];
}

export const serviceStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.service",
  classification: "read",
  buildFrames: buildStatusFrames,
  parse: (exchanges) => parseStatus(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// Sub-form completion (S8): `service -r|-l|-i|-t|-c` (rawLine 13038).
// ---------------------------------------------------------------------------

export const serviceRefresh = defineCommandOperation("cli.service.refresh", "read", "service -r");

export interface ServiceLoginInput {
  /** MyVigor account name. */
  readonly account: string;
  /** MyVigor password (secret). */
  readonly password: string;
}

export const serviceLogin = defineRawOperation<ServiceLoginInput>(
  "cli.service.login",
  "write",
  (input) => {
    assertCliValue(input.account, "account");
    assertCliValue(input.password, "password");
    return `service -l ${input.account} ${input.password}`;
  },
);

export interface ServiceTransferOwnerInput {
  readonly newOwner: string;
  readonly newOwnerEmail: string;
}

export const serviceTransferOwner = defineRawOperation<ServiceTransferOwnerInput>(
  "cli.service.transferowner",
  "write",
  (input) => {
    assertCliValue(input.newOwner, "newOwner");
    assertCliValue(input.newOwnerEmail, "newOwnerEmail");
    return `service -i ${input.newOwner} ${input.newOwnerEmail}`;
  },
);

export interface ServiceTransferInput {
  /** `true` transfers this device to the new owner (`yes`); `false` cancels (`no`). */
  readonly confirm: boolean;
}

/** Transfers device ownership to the owner set by `service -i`: destructive. */
export const serviceTransfer = defineRawOperation<ServiceTransferInput>(
  "cli.service.transfer",
  "destructive",
  (input) => `service -t ${input.confirm ? "yes" : "no"}`,
);

/** Clears the current owner's MyVigor account information: destructive. */
export const serviceClear = defineCommandOperation(
  "cli.service.clear",
  "destructive",
  "service -c",
);

export const operations: readonly TypedOperation<never, unknown>[] = [
  serviceStatus,
  serviceRefresh,
  serviceLogin,
  serviceTransferOwner,
  serviceTransfer,
  serviceClear,
];
