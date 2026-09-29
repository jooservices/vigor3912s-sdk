/**
 * Part VIII documented syntax forms: every line of each heading's `Syntax`
 * block, and a matcher deciding whether a concrete command is an instance of
 * a form. Drives the sub-form census (`tools/check-operation-usage.ts`).
 */

import { decodeDoubledLetters, extractCommandTitle, findCliHeadingLines } from "./cli-corpus.ts";

export interface SyntaxForm {
  /** Heading title, e.g. `ip arp`. */
  readonly heading: string;
  /** 1-based line in `cli-reference-raw.txt`. */
  readonly rawLine: number;
  /** The documented form, whitespace-normalized. */
  readonly form: string;
}

const SYNTAX_MARKER = "SSyynnttaaxx";
const SYNTAX_DESCRIPTION_MARKER = "SSyynnttaaxx  DDeessccrriippttiioonn";
const EXAMPLE_MARKER = "EExxaammppllee";

/** Page furniture inside a Syntax block (page markers, running footer). */
function isPageFurniture(line: string): boolean {
  return line.length === 0 || /^===PAGE \d+===$/.test(line) || /^Vigor3912 Series User/.test(line);
}

function unbalanced(form: string): boolean {
  const count = (pattern: RegExp): number => form.match(pattern)?.length ?? 0;

  return count(/</g) > count(/>/g) || count(/\[/g) > count(/]/g);
}

/** Joins a wrapped continuation; a bracket list split mid-token (`.../8` + `3/84...`) joins without a space. */
function joinWrapped(previous: string, continuation: string): string {
  const glue =
    /[/<[]$/.test(previous) ||
    /^[/>\]]/.test(continuation) ||
    (/\d$/.test(previous) && /^\d/.test(continuation) && unbalanced(previous))
      ? ""
      : " ";

  return `${previous}${glue}${continuation}`.replace(/\s+/g, " ");
}

export function extractSyntaxForms(rawText: string): readonly SyntaxForm[] {
  const lines = rawText.split("\n");
  const headingLines = new Set(findCliHeadingLines(lines));
  const forms: SyntaxForm[] = [];
  let heading: string | undefined;
  let inSyntax = false;
  let blockStart = 0;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (headingLines.has(index + 1)) {
      heading = extractCommandTitle(decodeDoubledLetters(line));
      inSyntax = false;
      return;
    }

    if (line.startsWith(SYNTAX_DESCRIPTION_MARKER) || line.startsWith(EXAMPLE_MARKER)) {
      inSyntax = false;
      return;
    }

    if (line.startsWith(SYNTAX_MARKER)) {
      inSyntax = true;
      blockStart = index + 1;
      return;
    }

    if (!inSyntax || heading === undefined || isPageFurniture(line)) {
      return;
    }

    const firstWord = heading.split(/\s+/)[0]?.toLowerCase() ?? "";
    const previous = forms.at(-1);

    // A wrapped form continues on the next line: a leading `<`/`[`/`/`/`|`/
    // `-`/digit/quote, or an unclosed bracket on the line before.
    if (
      previous !== undefined &&
      previous.rawLine >= blockStart &&
      (/^[<[/|\-\d"(]/.test(line) || unbalanced(previous.form))
    ) {
      forms[forms.length - 1] = {
        ...previous,
        form: joinWrapped(previous.form, line),
      };
      return;
    }

    // Prose between the Syntax block and its description ends the block.
    if (!line.toLowerCase().startsWith(firstWord)) {
      inSyntax = false;
      return;
    }

    forms.push({ heading, rawLine: index + 1, form: line.replace(/\s+/g, " ") });
  });

  return forms;
}

type PatternToken =
  | { readonly kind: "literal"; readonly text: string }
  | { readonly kind: "choice"; readonly options: readonly string[] }
  | { readonly kind: "value" }
  | { readonly kind: "rest" };

/**
 * Pattern tokens of a documented form:
 * - `<value>` or an ALL-CAPS placeholder (`INDEX`, `MSG`) or an alternation
 *   (`P|B`) = one value token;
 * - `[optional]`, `...`, `?`, or a composite group whose inner structure the
 *   manual does not spell out token by token (`<-i IP>`, nested `<a <b>>`,
 *   `<x | y>`) = any remaining tokens (the form is then matched by its
 *   literal prefix);
 * - anything else = a literal keyword/flag (case-insensitive).
 */
/** Splits a form on whitespace that is outside `<...>` / `[...]` groups. */
function splitChunks(form: string): readonly string[] {
  const chunks: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of form) {
    if (char === "<" || char === "[") {
      depth += 1;
    } else if ((char === ">" || char === "]") && depth > 0) {
      depth -= 1;
    }

    if (/\s/.test(char) && depth === 0) {
      if (current.length > 0) {
        chunks.push(current);
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

/**
 * Expands a chunk that glues groups and text together:
 * - `<a>/<b>`, `<a>-<b>`, `<a>:<b>` \u2192 one compound value (`10.0.0.0/24`);
 * - `<x>Mb` \u2192 one value (`100Mb`);
 * - `list<index>`, `phase1<lifetime>` \u2192 the literal, then a value;
 * - `<a><b>` \u2192 two values.
 */
function expandChunk(chunk: string): readonly string[] {
  if (chunk.startsWith("[") || !chunk.includes("<") || /^<[^<>]*>+$/.test(chunk)) {
    return [chunk];
  }

  const parts = chunk.match(/<[^>]*>+|[^<]+/g) ?? [chunk];

  if (parts.some((part) => !part.startsWith("<") && /^[/:.=-]+$/.test(part))) {
    return ["<compound>"];
  }

  const [first, last] = parts;

  if (parts.length === 2 && first.startsWith("<") && last !== undefined && !last.startsWith("<")) {
    return ["<value>"];
  }

  return parts;
}

/** Lowercase words the manual uses as a trailing placeholder, not a keyword. */
const TRAILING_PLACEHOLDER_WORDS: ReadonlySet<string> = new Set([
  "port",
  "option",
  "options",
  "value",
  "index",
  "name",
  "time",
]);

export function tokenizeForm(form: string): readonly PatternToken[] {
  const tokens: PatternToken[] = [];
  const normalized = form.replace(/[\u2013\u2014]/g, "-");

  for (const token of splitChunks(normalized).flatMap(expandChunk)) {
    const inner = token.startsWith("<") ? token.replace(/^<|>+$/g, "") : "";
    const composite =
      token.startsWith("<") && (/^\s*-/.test(inner) || inner.includes("|") || inner.includes("<"));

    if (
      token.startsWith("[") ||
      token.startsWith('"') ||
      token === "..." ||
      token === "?" ||
      composite
    ) {
      tokens.push({ kind: "rest" });
      break;
    }

    const previous = tokens.at(-1);
    const afterFlag =
      previous?.kind === "literal" && /^-[a-z]$/i.test(previous.text)
        ? true
        : previous?.kind === "value";

    // A capitalised word right after a flag (or another placeholder word) is
    // a prose placeholder: `-s Service Provider`, `-n Profile Name`.
    if (afterFlag && /^[A-Z][a-z]+$/.test(token)) {
      if (previous?.kind !== "value") {
        tokens.push({ kind: "value" });
      }
      continue;
    }

    // Bare placeholders: ALL-CAPS (`INDEX`), single lowercase letters used
    // as numbers (`n`, `m`, `s r`), `*_no` names (`pri_no`, `vid_no`) and
    // Capitalised_Snake names (`KEY_WORD_Object_Index`).
    if (
      token.startsWith("<") ||
      token.includes("|") ||
      /^[A-Z][A-Z0-9_]+$/.test(token) ||
      /^[a-z]$/.test(token) ||
      /^[a-z]+_no$/.test(token) ||
      /^[A-Z][A-Za-z]*(_[A-Za-z]+)+$/.test(token)
    ) {
      tokens.push({ kind: "value" });
    } else if (/^-?[a-z][\w-]*(\/-?[a-z][\w-]*)+$/i.test(token)) {
      // Keyword alternatives written as `enable/disable`, or flags as `-h/l`.
      const options = token.toLowerCase().split("/");
      const dashed = options[0]?.startsWith("-") === true;

      tokens.push({
        kind: "choice",
        options: dashed
          ? options.map((option) => (option.startsWith("-") ? option : `-${option}`))
          : options,
      });
    } else {
      tokens.push({ kind: "literal", text: token.toLowerCase() });
    }
  }

  // A trailing bare placeholder word (`add port`, `set INDEX option`).
  const last = tokens.at(-1);

  if (last?.kind === "literal" && tokens.length > 2 && TRAILING_PLACEHOLDER_WORDS.has(last.text)) {
    tokens[tokens.length - 1] = { kind: "value" };
  }

  return tokens;
}

export function formMatchesCommand(form: string, command: string): boolean {
  const pattern = tokenizeForm(form);
  const words = command.trim().split(/\s+/);

  for (const [index, token] of pattern.entries()) {
    if (token.kind === "rest") {
      return true;
    }

    const word = words[index];

    if (word === undefined) {
      return false;
    }

    if (token.kind === "literal" && word.toLowerCase() !== token.text) {
      return false;
    }

    if (token.kind === "choice" && !token.options.includes(word.toLowerCase())) {
      return false;
    }
  }

  // A trailing placeholder may stand for several tokens (the manual often
  // folds a whole option list into one `<option>`).
  return pattern.at(-1)?.kind === "value"
    ? words.length >= pattern.length
    : words.length === pattern.length;
}
