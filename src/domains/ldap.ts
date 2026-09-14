/**
 * `ldap` domain -- Wave 4 Item5-ldap (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements all 3 already-classified `cli.ldap.*` manifest entries (all
 * `classificationBasis: "sibling-live-verified"`, cross-referenced against
 * `projects/vigor3912s-mcp/src/commands/registry/families/ldap.ts`, evidence
 * only, never imported at runtime):
 *
 * - `cli.ldap.user` (write) -- `ldap user <INDEX><OPTION>` (rawLine 4033).
 * - `cli.ldap.set` (write) -- `ldap set <Options><Value>` (rawLine 4073).
 * - `cli.ldap.view` (read) -- `ldap view` (rawLine 4107).
 *
 * Every `buildFrames` validates its input before calling
 * `frameSingleCommand` -- `frameSingleCommand` itself only rejects framing
 * hazards (control chars, shell metacharacters, empty input), it has no
 * notion of a command's own documented argument shape. Validation failures
 * throw a plain `Error` (this family's write scope excludes `src/errors.ts`,
 * so no new `SdkErrorCode` is introduced here).
 *
 * `ldap user`'s multi-variant documented `OPTION` syntax (`-n`/`-b`/`-a`/
 * `-g`/`-c`/`-v`) and `ldap set`'s multi-variant `<Options>` syntax
 * (`enable`/`type`/`ssl`/`IP`/`port`/`dn`/`PWD`) are each modelled as one
 * discriminated union input, one canonical frame per variant -- still
 * exactly one `TypedOperation` per manifest entry, per `wan.ts`'s precedent
 * for `wan vlan`/`wan budget`/`wan failover`.
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/ldap/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseUser } from "../internal/parsers/ldap/user.js";
import { parseSet } from "../internal/parsers/ldap/set.js";
import { parseLdapView, type LdapViewReport } from "../internal/parsers/ldap/view.js";
import type { RawCommandOutput } from "../internal/parsers/ldap/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];

  return first?.stdout ?? "";
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

function assertNonEmpty(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
}

/**
 * Generic runtime membership check for narrow string/number-literal-union
 * inputs. Declared generically (rather than as direct `!==` comparisons
 * against the union's own members) so `@typescript-eslint/no-unnecessary-
 * condition` doesn't flag it as statically-impossible: TypeScript's own
 * literal types only describe well-behaved callers, but this validation
 * exists precisely for callers (including plain-JS callers and tests) that
 * don't honor them.
 */
function assertOneOf<T>(value: T, allowed: readonly T[], name: string): void {
  if (!allowed.includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => `"${String(entry)}"`).join(", ")} (got "${String(value)}").`,
    );
  }
}

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function assertIpv4(value: string, name: string): void {
  if (!IPV4_PATTERN.test(value)) {
    throw new Error(`${name} must be a valid IPv4 address (got "${value}").`);
  }
}

// ---------------------------------------------------------------------------
// cli.ldap.user -- `ldap user <INDEX><OPTION>` (rawLine 4033) -- write
// ---------------------------------------------------------------------------

const LDAP_USER_INDEX_MIN = 1;
const LDAP_USER_INDEX_MAX = 8;

export type LdapUserInput =
  | { readonly index: number; readonly action: "name"; readonly value: string }
  | { readonly index: number; readonly action: "baseDn"; readonly value: string }
  | { readonly index: number; readonly action: "filter"; readonly value: string }
  | { readonly index: number; readonly action: "groupDn"; readonly value: string }
  | { readonly index: number; readonly action: "commonName"; readonly value: string }
  | { readonly index: number; readonly action: "view" };

function buildUserFrames(input: LdapUserInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, LDAP_USER_INDEX_MIN, LDAP_USER_INDEX_MAX, "index");

  const prefix = `ldap user ${String(input.index)}`;

  switch (input.action) {
    case "name": {
      assertNonEmpty(input.value, "value");

      return [frameSingleCommand(`${prefix} -n ${input.value}`)];
    }
    case "baseDn": {
      assertNonEmpty(input.value, "value");

      return [frameSingleCommand(`${prefix} -b ${input.value}`)];
    }
    case "filter": {
      assertNonEmpty(input.value, "value");

      return [frameSingleCommand(`${prefix} -a ${input.value}`)];
    }
    case "groupDn": {
      assertNonEmpty(input.value, "value");

      return [frameSingleCommand(`${prefix} -g ${input.value}`)];
    }
    case "commonName": {
      assertNonEmpty(input.value, "value");

      return [frameSingleCommand(`${prefix} -c ${input.value}`)];
    }
    case "view": {
      return [frameSingleCommand(`${prefix} -v`)];
    }
  }
}

export const ldapUser: TypedOperation<LdapUserInput, RawCommandOutput> = {
  manifestId: "cli.ldap.user",
  classification: "write",
  buildFrames: buildUserFrames,
  parse: (exchanges) => parseUser(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ldap.set -- `ldap set <Options><Value>` (rawLine 4073) -- write
// ---------------------------------------------------------------------------

export type LdapSetInput =
  | { readonly option: "enable"; readonly enabled: boolean }
  | { readonly option: "type"; readonly bindType: 0 | 1 | 2 }
  | { readonly option: "ssl"; readonly enabled: boolean }
  | { readonly option: "ip"; readonly ipAddress: string }
  | { readonly option: "port"; readonly port: number }
  | { readonly option: "dn"; readonly value: string }
  | { readonly option: "password"; readonly value: string };

function buildSetFrames(input: LdapSetInput): readonly CommandFrame[] {
  switch (input.option) {
    case "enable": {
      return [frameSingleCommand(`ldap set enable ${input.enabled ? "1" : "0"}`)];
    }
    case "type": {
      assertOneOf(input.bindType, [0, 1, 2], "bindType");

      return [frameSingleCommand(`ldap set type ${String(input.bindType)}`)];
    }
    case "ssl": {
      return [frameSingleCommand(`ldap set ssl ${input.enabled ? "1" : "0"}`)];
    }
    case "ip": {
      assertIpv4(input.ipAddress, "ipAddress");

      return [frameSingleCommand(`ldap set IP ${input.ipAddress}`)];
    }
    case "port": {
      assertIntegerInRange(input.port, 1, 65535, "port");

      return [frameSingleCommand(`ldap set port ${String(input.port)}`)];
    }
    case "dn": {
      assertNonEmpty(input.value, "value");

      return [frameSingleCommand(`ldap set dn ${input.value}`)];
    }
    case "password": {
      assertNonEmpty(input.value, "value");

      return [frameSingleCommand(`ldap set PWD ${input.value}`)];
    }
  }
}

export const ldapSet: TypedOperation<LdapSetInput, RawCommandOutput> = {
  manifestId: "cli.ldap.set",
  classification: "write",
  buildFrames: buildSetFrames,
  parse: (exchanges) => parseSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.ldap.view -- `ldap view` (rawLine 4107) -- read
// ---------------------------------------------------------------------------

function buildViewFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("ldap view")];
}

export const ldapView: TypedOperation<void, LdapViewReport> = {
  manifestId: "cli.ldap.view",
  classification: "read",
  buildFrames: buildViewFrames,
  parse: (exchanges) => parseLdapView(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [ldapUser, ldapSet, ldapView];
