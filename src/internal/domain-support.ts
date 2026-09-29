/**
 * Validation and exchange helpers shared by every `src/domains/*.ts` module.
 * Previously copied verbatim into each domain (27+ copies); the bodies here
 * are those exact copies, so behavior and error messages are unchanged.
 *
 * `tools/manifest/input-schemas.ts` reads numeric constraints from calls to
 * `assertInteger` / `assertIntegerInRange` / `assertPositiveInteger` /
 * `assertNonNegativeInteger` — keep their names and semantics stable.
 */

import { InvalidInputError } from "../errors.js";
import { type CommandFrame, frameSingleCommand } from "./execution/framing.js";
import type { CommandExchange } from "./execution/transport.js";
import { parseRawText, type RawCommandOutput } from "./parsers/raw-text.js";
import type { OperationClassification, TypedOperation } from "./registry/operation.js";

export const IPV4_PATTERN =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

/** stdout of the first exchange (every typed operation here sends one frame). */
export function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

export function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new InvalidInputError(`${name} must be an integer (got ${String(value)}).`);
  }
}

export function assertIntegerInRange(value: number, min: number, max: number, name: string): void {
  assertInteger(value, name);

  if (value < min || value > max) {
    throw new InvalidInputError(
      `${name} must be between ${String(min)} and ${String(max)} (got ${String(value)}).`,
    );
  }
}

export function assertPositiveInteger(value: number, name: string): void {
  assertInteger(value, name);

  if (value <= 0) {
    throw new InvalidInputError(`${name} must be a positive integer (got ${String(value)}).`);
  }
}

export function assertNonNegativeInteger(value: number, name: string): void {
  assertInteger(value, name);

  if (value < 0) {
    throw new InvalidInputError(`${name} must not be negative (got ${String(value)}).`);
  }
}

/**
 * Runtime membership check for literal-union inputs: typed callers cannot
 * pass another value, but untyped input (JSON from an MCP tool) can.
 */
export function assertOneOf<T>(
  value: unknown,
  allowed: readonly T[],
  name: string,
): asserts value is T {
  if (!(allowed as readonly unknown[]).includes(value)) {
    throw new InvalidInputError(
      `${name} must be one of ${allowed.map((entry) => JSON.stringify(entry)).join(", ")} (got ${JSON.stringify(value)}).`,
    );
  }
}

export function assertNumberOneOf<T extends number>(
  value: T,
  allowed: readonly T[],
  name: string,
): void {
  if (!(allowed as readonly number[]).includes(value)) {
    throw new InvalidInputError(
      `${name} must be one of ${allowed.map((entry) => String(entry)).join(", ")} (got ${String(value)}).`,
    );
  }
}

export function assertIpv4(value: string, name: string): void {
  if (!IPV4_PATTERN.test(value)) {
    throw new InvalidInputError(`${name} must be a valid IPv4 address (got "${value}").`);
  }
}

const MAC_PATTERNS = {
  colon: /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,
  dash: /^([0-9A-Fa-f]{2}-){5}[0-9A-Fa-f]{2}$/,
  colonOrDash: /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/,
  bare: /^[0-9A-Fa-f]{12}$/,
} as const;

const MAC_FORMAT_LABELS: Readonly<Record<MacFormat, string>> = {
  colon: "XX:XX:XX:XX:XX:XX",
  dash: "XX-XX-XX-XX-XX-XX",
  colonOrDash: "XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX",
  bare: "of 12 hex digits",
};

/** MAC notation a command documents (DrayOS families differ). */
export type MacFormat = keyof typeof MAC_PATTERNS;

export function assertMac(value: string, name: string, format: MacFormat = "colon"): void {
  if (!MAC_PATTERNS[format].test(value)) {
    throw new InvalidInputError(
      `${name} must be a MAC address ${MAC_FORMAT_LABELS[format]} (got "${value}").`,
    );
  }
}

export function assertNonEmpty(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new InvalidInputError(`${name} must not be empty.`);
  }
}

export function assertNonEmptyToken(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new InvalidInputError(`${label} must not be empty or whitespace-only.`);
  }
  if (/\s/.test(value)) {
    throw new InvalidInputError(`${label} must not contain whitespace.`);
  }
  if (value.includes('"')) {
    throw new InvalidInputError(`${label} must not contain a double quote.`);
  }
}

/**
 * One CLI argument token. The value is not echoed: callers pass passwords
 * and secrets through here too.
 */
export function assertSingleToken(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new InvalidInputError(`${name} must not be empty.`);
  }

  if (/\s/.test(value)) {
    throw new InvalidInputError(
      `${name} must not contain whitespace (a single non-empty token is expected).`,
    );
  }

  if (value.includes('"')) {
    throw new InvalidInputError(`${name} must not contain a double quote.`);
  }

  if (/[;&|`]|\$\(/.test(value)) {
    throw new InvalidInputError(`${name} must not contain shell metacharacters.`);
  }
}

/**
 * A caller-supplied value placed as one CLI argument (name, comment, key,
 * password, ...): a single token that cannot be read as a flag, so it can
 * never add options to the command. The value is not echoed.
 */
export function assertCliValue(value: string, name: string): void {
  assertSingleToken(value, name);

  if (value.startsWith("-")) {
    throw new InvalidInputError(`${name} must not start with "-".`);
  }
}

/**
 * Documented free text that DrayOS reads to the end of the line (a message,
 * a trailing comment, a search phrase): spaces are allowed, but no word may
 * look like a flag and no `"` may appear. The value is not echoed.
 */
export function assertTrailingText(value: string, name: string): void {
  assertNonEmpty(value, name);

  if (value.includes('"') || value.split(/\s+/).some((word) => word.startsWith("-"))) {
    throw new InvalidInputError(
      `${name} must not contain a double quote or a word starting with "-".`,
    );
  }
}

export function assertArgsShape(args: readonly string[], label: string): void {
  if (args.length === 0) {
    throw new InvalidInputError(`${label} requires at least one argument token.`);
  }
  for (const [index, token] of args.entries()) {
    assertNonEmptyToken(token, `${label} argument #${String(index + 1)}`);
  }
}

/**
 * Flag-style argument list (`dos -P add4 ...`): starts with a documented
 * flag (or a documented leading keyword such as `ip policy_rt diagnose`),
 * and every `-x` token is one of the documented flags, so no value can
 * smuggle in another option.
 */
export function assertKnownFlags(
  args: readonly string[],
  allowedFlags: readonly string[],
  label: string,
  leadingKeywords: readonly string[] = [],
): void {
  for (const token of args) {
    if (token.startsWith("-") && !allowedFlags.includes(token)) {
      throw new InvalidInputError(
        `${label} flag "${token}" is not one of the documented flags: ${allowedFlags.join(", ")}.`,
      );
    }
  }

  const [first] = args;

  if (first !== undefined && !allowedFlags.includes(first) && !leadingKeywords.includes(first)) {
    throw new InvalidInputError(
      `${label} must start with one of: ${[...leadingKeywords, ...allowedFlags].join(", ")}.`,
    );
  }
}

/** Documented grammar of an opaque parameter tail (`vpn ovpn <param>`, ...). */
export interface ParamTailGrammar {
  /** Keywords the first token must be one of. */
  readonly firstToken?: readonly string[];
  /** Also accept an integer as the first token (e.g. `vpn l2lDrop <ifno>`). */
  readonly allowIntegerFirst?: boolean;
  /**
   * Documented `-x` flags. Omitted: no token may start with `-`. `"any"`:
   * the syntax is undocumented, so dash tokens are passed through.
   */
  readonly flags?: readonly string[] | "any";
  /** Pattern every token must match (e.g. `cmd=value`). */
  readonly tokenPattern?: RegExp;
}

export const MAX_PARAM_TAIL_LENGTH = 255;

/**
 * Space-separated parameter tail for commands the SDK passes through as text.
 * Bounds it to the command's documented grammar so a caller cannot reach
 * another subcommand or an undocumented flag. The value is not echoed.
 */
export function assertParamTail(value: string, name: string, grammar: ParamTailGrammar = {}): void {
  if (value.trim().length === 0 || value.length > MAX_PARAM_TAIL_LENGTH) {
    throw new InvalidInputError(
      `${name} must be 1-${String(MAX_PARAM_TAIL_LENGTH)} characters and not blank.`,
    );
  }

  if (/[\p{Cc};|&`$"]/u.test(value)) {
    throw new InvalidInputError(
      `${name} must not contain control characters, shell metacharacters or double quotes.`,
    );
  }

  const tokens = value.trim().split(/\s+/);
  const [first = ""] = tokens;
  const flags = grammar.flags;

  if (
    grammar.firstToken !== undefined &&
    !grammar.firstToken.includes(first) &&
    !(grammar.allowIntegerFirst === true && /^\d+$/.test(first))
  ) {
    throw new InvalidInputError(
      `${name} must start with one of ${grammar.firstToken.join(", ")}${grammar.allowIntegerFirst === true ? " or an integer" : ""}.`,
    );
  }

  for (const token of tokens) {
    if (token.startsWith("-") && flags !== "any" && !(flags ?? []).includes(token)) {
      throw new InvalidInputError(
        flags === undefined
          ? `${name} must not contain a token starting with "-".`
          : `${name} flag must be one of ${flags.join(", ")}.`,
      );
    }

    if (grammar.tokenPattern !== undefined && !grammar.tokenPattern.test(token)) {
      throw new InvalidInputError(`${name} tokens must match ${String(grammar.tokenPattern)}.`);
    }
  }
}

export function assertMaxLength(value: string, max: number, name: string): void {
  if (value.length > max) {
    throw new InvalidInputError(
      `${name} must be at most ${String(max)} characters (got ${String(value.length)}).`,
    );
  }
}

/**
 * Fixed-length (tuple) input guard. Typed callers cannot pass the wrong
 * length, but untyped input (JSON from an MCP tool) can, and a short or long
 * list would build a malformed command.
 */
export function assertTupleLength(values: readonly unknown[], length: number, name: string): void {
  if (values.length !== length) {
    throw new InvalidInputError(
      `${name} must contain exactly ${String(length)} entries (got ${String(values.length)}).`,
    );
  }
}

/** Acknowledgement/raw-text output: DrayOS documents no structured shape. */
export type RawTextOutput = RawCommandOutput;

/**
 * Defines a single-frame operation whose output is the trimmed raw text of
 * the exchange. `build` validates its input (throwing on invalid values) and
 * returns the exact command.
 */
export function defineRawOperation<TInput>(
  manifestId: string,
  classification: OperationClassification,
  build: (input: TInput) => string,
): TypedOperation<TInput, RawTextOutput> {
  // Keep the arity honest: an input-less operation's `buildFrames` takes no
  // parameter (introspected by the schema census oracle).
  const buildFrames: (input: TInput) => readonly CommandFrame[] =
    build.length === 0
      ? () => [frameSingleCommand((build as () => string)())]
      : (input) => [frameSingleCommand(build(input))];

  return {
    manifestId,
    classification,
    buildFrames,
    parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
  };
}

/** A fixed, input-less command whose output is the trimmed raw text. */
export function defineCommandOperation(
  manifestId: string,
  classification: OperationClassification,
  command: string,
): TypedOperation<void, RawTextOutput> {
  return {
    manifestId,
    classification,
    buildFrames: () => [frameSingleCommand(command)],
    parse: (exchanges) => parseRawText(firstExchangeText(exchanges)),
  };
}

export const ON_OFF = ["on", "off"] as const;

export function onOff(enabled: boolean): "on" | "off" {
  return enabled ? "on" : "off";
}
