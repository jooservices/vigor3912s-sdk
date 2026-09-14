/**
 * `user` domain -- Wave 4 tiny-family batch (`BACKLOG.md` "Wave 4" family
 * task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the single already-classified `cli.user` manifest entry
 * (rawLine 11800), basis `sibling-live-verified` (`vigor3912s-mcp`'s
 * `src/commands/registry/families/user.ts`, consulted read-only as evidence,
 * never imported/depended on at runtime), classified `write`. The heading
 * documents four top-level sub-commands, each with its own large flag
 * vocabulary (`user set <-a|-b|...>`, `user edit <PROFILE_IDX>
 * <-a|-d|...>`, `user account <USER_NAME><-t|-d|...>`, `user setdefault`) --
 * modelled here as a discriminated `action` union, one canonical frame per
 * top-level sub-command (same pattern as `wan.ts`'s `wanVlan`/`wanBudget`),
 * still exactly one `TypedOperation` for the one `cli.user` manifest entry.
 * Individual per-flag validation of every documented `-a`..`-x` option is a
 * deliberate YAGNI deferral -- each variant's free-form flag/argument text is
 * passed through as a single validated (non-empty, control-character-free)
 * string, consistent with the sibling `vigor3912s-mcp` registry's own
 * `safeText()`-validated generic-parameter approach for this same family.
 *
 * `parse` is thin: pulls the first exchange's `stdout` and hands it to a
 * pure `(text: string) => TOutput` parser in `internal/parsers/user/*.ts`
 * (`ARCHITECTURE.md` Item 5's parser signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseManage } from "../internal/parsers/user/manage.js";
import type { RawCommandOutput } from "../internal/parsers/user/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

/**
 * `user set`/`user edit`/`user account` all take free-form flag/argument
 * text (e.g. `-o`, `-n fortest`, `carol -w`) per the documented syntax --
 * this only rejects empty/whitespace-only and control-character input;
 * `frameSingleCommand` itself independently rejects shell metacharacters.
 */
function assertSafeParam(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }

  if (/\p{Cc}/u.test(value)) {
    throw new Error(`${name} must not contain control characters.`);
  }
}

function assertNonEmpty(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
}

// ---------------------------------------------------------------------------
// cli.user -- `user set` / `user edit` / `user account` / `user setdefault`
// (rawLine 11800) -- write
// ---------------------------------------------------------------------------

export type UserManageInput =
  | { readonly action: "set"; readonly param: string }
  | { readonly action: "edit"; readonly profileIdx: number; readonly param: string }
  | { readonly action: "account"; readonly userName: string; readonly param: string }
  | { readonly action: "setdefault" };

function buildManageFrames(input: UserManageInput): readonly CommandFrame[] {
  switch (input.action) {
    case "set": {
      assertSafeParam(input.param, "param");

      return [frameSingleCommand(`user set ${input.param}`)];
    }
    case "edit": {
      if (!Number.isInteger(input.profileIdx) || input.profileIdx < 0) {
        throw new Error(
          `profileIdx must be a non-negative integer (got ${String(input.profileIdx)}).`,
        );
      }

      assertSafeParam(input.param, "param");

      return [frameSingleCommand(`user edit ${String(input.profileIdx)} ${input.param}`)];
    }
    case "account": {
      assertNonEmpty(input.userName, "userName");
      assertSafeParam(input.param, "param");

      return [frameSingleCommand(`user account ${input.userName} ${input.param}`)];
    }
    case "setdefault": {
      return [frameSingleCommand("user setdefault")];
    }
  }
}

export const userManage: TypedOperation<UserManageInput, RawCommandOutput> = {
  manifestId: "cli.user",
  classification: "write",
  buildFrames: buildManageFrames,
  parse: (exchanges) => parseManage(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [userManage];
