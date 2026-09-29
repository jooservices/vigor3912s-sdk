/**
 * `hsportal` domain -- Wave 4 Item5-hsportal (`BACKLOG.md` "Wave 4" family
 * task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the 3 already-classified `cli.hsportal.*` manifest entries
 * listed in this task's assignment (all `classificationBasis:
 * "sibling-live-verified"`). The 4th sibling entry under the same
 * "hsportal" `commandPath[0]` -- `cli.hsportal.pingen` -- is deliberately
 * left unimplemented: its manifest `classification` is still
 * `"unknown"`/`"unclassified"`, and classifying it is explicitly out of
 * scope for this task (YAGNI deferral, not an oversight).
 *
 * `cli.hsportal.info` / `cli.hsportal.level` narrowing (mirrors
 * `src/domains/wan.ts`'s `cli.wan.detect` precedent): the vendor doc
 * (rawLine 11458 / 11494) documents these headings with several `-e`/`-c`/
 * `-n`/`-a`/`-m`/`-s` (info) and `-p`/`-e`/`-t`/`-i`/`-o` (level)
 * configuration flags that look like mutations, but the sibling
 * `vigor3912s-mcp` project (live-verified against fw 4.4.7_RC2, `hsportal_info`
 * / `hsportal_level` in `src/commands/registry/families/hsportal.ts`) models
 * only the bare, argument-less `hsportal info` / `hsportal level` query form
 * as `read` -- the flag-based configuration sub-forms are a genuine write
 * action on this same family, narrowed out of these operations (which model
 * only the documented bare read query) so each `TypedOperation`'s own
 * `classification` honestly matches what it does. Modelling those sub-forms
 * would need either an `"info"`/`"level"` classification of `"write"`
 * (contradicting the live-verified evidence) or a future per-subcommand
 * manifest split -- a deliberate YAGNI deferral, not an oversight.
 *
 * `cli.hsportal.setup` (write): the heading documents many independent
 * `-p <profile> <flag> ...` sub-forms (`command-map.md`'s and the vendor
 * doc's own "Example" section: profile reset `-c`, landing-page mode `-r`,
 * facebook/google login config `-f`/`-g` + `-i`/`-k`, plus profile
 * enable/disable `-e`/`-d`). This operation models the sub-forms with
 * concrete documented examples as a discriminated `action` union, one
 * canonical frame per variant -- still exactly one `TypedOperation` per
 * manifest entry, not an invented extra command. The `-l` (apply LAN
 * interfaces), `-m` (login mode), `-h` (HTTPS redirection), `-v` (portal
 * detection), and `-o` (clear profiles for all clients) sub-forms are a
 * deliberate YAGNI deferral (no concrete documented example to pin an exact
 * frame shape against).
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
 * `internal/parsers/hsportal/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature).
 */

import { InvalidInputError } from "../errors.js";
import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseSetup } from "../internal/parsers/hsportal/setup.js";
import { parseInfo } from "../internal/parsers/hsportal/info.js";
import { parseLevel } from "../internal/parsers/hsportal/level.js";
import type { RawCommandOutput } from "../internal/parsers/hsportal/shared.js";
import {
  assertCliValue,
  assertIntegerInRange,
  assertOneOf,
  defineCommandOperation,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

const HSPORTAL_PROFILE_MIN = 1;
const HSPORTAL_PROFILE_MAX = 4;

function assertProfile(value: number): void {
  assertIntegerInRange(value, HSPORTAL_PROFILE_MIN, HSPORTAL_PROFILE_MAX, "profile");
}

// ---------------------------------------------------------------------------
// cli.hsportal.setup -- `hsportal setup -p <profile> <flag> ...` (rawLine
// 11395) -- see the file-level comment above for the modelled sub-forms.
// ---------------------------------------------------------------------------

export type HsportalSetupInput =
  | { readonly profile: number; readonly action: "reset" }
  | { readonly profile: number; readonly action: "enable" }
  | { readonly profile: number; readonly action: "disable" }
  | { readonly profile: number; readonly action: "landingPageMode"; readonly mode: 0 | 1 | 2 }
  | {
      readonly profile: number;
      readonly action: "google";
      readonly enabled: boolean;
      readonly appKey: string;
    }
  | {
      readonly profile: number;
      readonly action: "facebook";
      readonly enabled: boolean;
      readonly appId: string;
    };

function buildSetupFrames(input: HsportalSetupInput): readonly CommandFrame[] {
  assertProfile(input.profile);

  const prefix = `hsportal setup -p ${String(input.profile)}`;

  switch (input.action) {
    case "reset": {
      return [frameSingleCommand(`${prefix} -c`)];
    }
    case "enable": {
      return [frameSingleCommand(`${prefix} -e`)];
    }
    case "disable": {
      return [frameSingleCommand(`${prefix} -d`)];
    }
    case "landingPageMode": {
      return [frameSingleCommand(`${prefix} -r ${String(input.mode)}`)];
    }
    case "google": {
      assertCliValue(input.appKey, "appKey");

      return [frameSingleCommand(`${prefix} -g ${input.enabled ? "1" : "0"} -k ${input.appKey}`)];
    }
    case "facebook": {
      assertCliValue(input.appId, "appId");

      return [frameSingleCommand(`${prefix} -f ${input.enabled ? "1" : "0"} -i ${input.appId}`)];
    }
  }
}

export const hsportalSetup: TypedOperation<HsportalSetupInput, RawCommandOutput> = {
  manifestId: "cli.hsportal.setup",
  classification: "write",
  buildFrames: buildSetupFrames,
  parse: (exchanges) => parseSetup(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.hsportal.info -- `hsportal info` (rawLine 11458) -- bare read query
// only; see the file-level comment above for the narrowing rationale.
// ---------------------------------------------------------------------------

function buildInfoFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("hsportal info")];
}

export const hsportalInfo: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.hsportal.info",
  classification: "read",
  buildFrames: buildInfoFrames,
  parse: (exchanges) => parseInfo(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.hsportal.level -- `hsportal level` (rawLine 11494) -- bare read query
// only; see the file-level comment above for the narrowing rationale.
// ---------------------------------------------------------------------------

function buildLevelFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("hsportal level")];
}

export const hsportalLevel: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.hsportal.level",
  classification: "read",
  buildFrames: buildLevelFrames,
  parse: (exchanges) => parseLevel(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// Sub-form completion (S8).
// ---------------------------------------------------------------------------

// `hsportal info -e|-n|-a <0/1>`, `-m|-s <1~10>` (rawLine 11458): user-info
// database, notification, auto backup, mail / SMS notification object.
export type HsportalInfoSetInput =
  | { readonly option: "database" | "notification" | "autoBackup"; readonly enabled: boolean }
  | { readonly option: "mailObject" | "smsObject"; readonly objectIndex: number };

const HSPORTAL_INFO_FLAG = {
  database: "-e",
  notification: "-n",
  autoBackup: "-a",
  mailObject: "-m",
  smsObject: "-s",
} as const;

export const hsportalInfoSet = defineRawOperation<HsportalInfoSetInput>(
  "cli.hsportal.info.set",
  "write",
  (input) => {
    switch (input.option) {
      case "mailObject":
      case "smsObject":
        assertIntegerInRange(input.objectIndex, 1, 10, "objectIndex");
        return `hsportal info ${HSPORTAL_INFO_FLAG[input.option]} ${String(input.objectIndex)}`;
      default:
        assertOneOf(input.option, ["database", "notification", "autoBackup"], "option");
        return `hsportal info ${HSPORTAL_INFO_FLAG[input.option]} ${input.enabled ? "1" : "0"}`;
    }
  },
);

/** `hsportal info -c`: clears the user information database (destructive). */
export const hsportalInfoClear = defineCommandOperation(
  "cli.hsportal.info.clear",
  "destructive",
  "hsportal info -c",
);

// `hsportal level -p <index> [-e ..] [-t ..] ...` (rawLine 11494): quota
// policy profile 1..20 settings; `-c <index>` deletes a profile.
const LEVEL_FLAGS = {
  e: { min: 0, max: 1 },
  t: { min: 0, max: 1_000_000 },
  i: { min: 0, max: 1 },
  o: { min: 0, max: 1_000_000 },
  d: { min: 0, max: 100 },
  b: { min: 0, max: 1 },
  ru: { min: 0, max: 1 },
  tu: { min: 0, max: 1 },
  s: { min: 0, max: 1 },
  n: { min: 0, max: 6000 },
  U: { min: 0, max: 1_000_000 },
  D: { min: 0, max: 1_000_000 },
  r: { min: 0, max: 1 },
  f: { min: 1, max: 1439 },
} as const;

export interface HsportalLevelSetting {
  /**
   * e enable, t expiry (min), i/o idle timeout on + minutes, d max devices
   * (0 unlimited), b bandwidth limit, ru/tu download/upload unit (0 kbps,
   * 1 mbps), U/D upload/download limit, s/n session limit + max sessions,
   * r/f reconnection restriction + block minutes.
   */
  readonly flag: keyof typeof LEVEL_FLAGS;
  readonly value: number;
}

export interface HsportalLevelSetInput {
  readonly profile: number;
  readonly settings: readonly HsportalLevelSetting[];
  /** `-g HH:MM`: daily time before which the same user may not reconnect. */
  readonly reconnectAt?: string;
}

export const hsportalLevelSet = defineRawOperation<HsportalLevelSetInput>(
  "cli.hsportal.level.set",
  "write",
  (input) => {
    assertIntegerInRange(input.profile, 1, 20, "profile");
    const parts = input.settings.map(({ flag, value }) => {
      const range = Object.hasOwn(LEVEL_FLAGS, flag) ? LEVEL_FLAGS[flag] : undefined;

      if (range === undefined) {
        throw new InvalidInputError(
          `flag must be one of ${Object.keys(LEVEL_FLAGS).join(", ")} (got "${flag}").`,
        );
      }

      assertIntegerInRange(value, range.min, range.max, `-${flag}`);
      return `-${flag} ${String(value)}`;
    });

    if (input.reconnectAt !== undefined) {
      if (!/^(0[1-9]|1\d|2[0-3]):[0-5]\d$/.test(input.reconnectAt)) {
        throw new InvalidInputError(
          `reconnectAt must be HH:MM with HH 01..23 (got "${input.reconnectAt}").`,
        );
      }

      parts.push(`-g ${input.reconnectAt}`);
    }

    if (parts.length === 0) {
      throw new InvalidInputError("at least one setting is required.");
    }

    return `hsportal level -p ${String(input.profile)} ${parts.join(" ")}`;
  },
);

export interface HsportalLevelDeleteInput {
  readonly profile: number;
}

export const hsportalLevelDelete = defineRawOperation<HsportalLevelDeleteInput>(
  "cli.hsportal.level.delete",
  "write",
  (input) => {
    assertIntegerInRange(input.profile, 1, 20, "profile");
    return `hsportal level -c ${String(input.profile)}`;
  },
);

export const operations: readonly TypedOperation<never, unknown>[] = [
  hsportalSetup,
  hsportalInfo,
  hsportalLevel,
  hsportalInfoSet,
  hsportalInfoClear,
  hsportalLevelSet,
  hsportalLevelDelete,
];
