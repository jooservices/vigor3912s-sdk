import { createHash } from "node:crypto";
import { isIP } from "node:net";

export const redactionRuleVersion = "fixture-redaction-v1" as const;

export interface RedactedFixture {
  readonly content: string;
  readonly inputSha256: string;
  readonly outputSha256: string;
  readonly redactionCounts: RedactionCounts;
}

export interface RedactionCounts {
  readonly ipv4: number;
  readonly ipv6: number;
  readonly mac: number;
  readonly domain: number;
  readonly labeledValue: number;
}

export interface ValidationFinding {
  readonly type: SensitiveType;
  readonly count: number;
}

export type SensitiveType = keyof RedactionCounts;

export class FixtureRedactionValidationError extends Error {
  public readonly findings: readonly ValidationFinding[];

  public constructor(findings: readonly ValidationFinding[]) {
    super(
      `Redacted fixture still contains sensitive forms: ${findings
        .map((finding) => `${finding.type}=${finding.count.toString()}`)
        .join(", ")}`,
    );
    this.name = "FixtureRedactionValidationError";
    this.findings = findings;
  }
}

const ipv4Pattern =
  /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g;
const macPattern = /\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b/gi;
const domainPattern = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/gi;
const labeledValuePattern =
  /(?<prefix>\b(?:api[-_ ]?key|auth(?:orization)?|cookie|key|pass(?:word|wd)?|pwd|session|token)\b\s*[:=]\s*["']?(?:(?:basic|bearer|digest|token)\s+)?)(?<value>[^\s"',;]+)/giu;
const hostLabelPattern =
  /(?<prefix>\b(?:domain|fqdn|host(?:name)?|server[-_ ]?name)\b\s*[:=]\s*["']?)(?<value>[^\s"',;]+)/giu;
const ipv6CandidatePattern = /\b[0-9a-f:.]{3,}\b/gi;

const emptyCounts = (): RedactionCounts => ({
  domain: 0,
  ipv4: 0,
  ipv6: 0,
  labeledValue: 0,
  mac: 0,
});

export function redactFixture(input: string): RedactedFixture {
  const seed = sha256(input);
  const counts = emptyCounts();
  const maps = {
    domain: new Map<string, string>(),
    ipv4: new Map<string, string>(),
    ipv6: new Map<string, string>(),
    labeledValue: new Map<string, string>(),
    mac: new Map<string, string>(),
  };

  let content = replaceLabeledValues(input, labeledValuePattern, "labeledValue", maps, counts);
  content = replaceLabeledValues(content, hostLabelPattern, "domain", maps, counts);
  content = replaceByPattern(content, macPattern, "mac", maps, counts, seed);
  content = replaceByPattern(content, ipv4Pattern, "ipv4", maps, counts, seed);
  content = replaceIpv6(content, maps.ipv6, counts, seed);
  content = replaceDomains(content, maps.domain, counts, seed);

  validateRedactedFixture(content);

  return {
    content,
    inputSha256: seed,
    outputSha256: sha256(content),
    redactionCounts: counts,
  };
}

export function validateRedactedFixture(content: string): void {
  const findings: ValidationFinding[] = [];
  const counts = {
    domain: countMatches(content, domainPattern, isAllowedDomain) + countHostLabeledValues(content),
    ipv4: countMatches(content, ipv4Pattern, isAllowedIpv4),
    ipv6: countIpv6(content),
    labeledValue: countLabeledValues(content),
    mac: countMatches(content, macPattern, isAllowedMac),
  } satisfies RedactionCounts;

  for (const type of Object.keys(counts) as SensitiveType[]) {
    const count = counts[type];

    if (count > 0) {
      findings.push({ count, type });
    }
  }

  if (findings.length > 0) {
    throw new FixtureRedactionValidationError(findings);
  }
}

export function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function replaceLabeledValues(
  content: string,
  pattern: RegExp,
  type: SensitiveType,
  maps: Record<SensitiveType, Map<string, string>>,
  counts: RedactionCounts,
): string {
  return content.replace(pattern, (...args: unknown[]): string => {
    const groups = args.at(-1) as { prefix?: string; value?: string };
    const prefix = groups.prefix ?? "";
    const value = groups.value ?? "";

    if (value === "" || isAllowedReplacement(value)) {
      return `${prefix}${value}`;
    }

    incrementCount(counts, type);

    return `${prefix}${replacementFor(type, value, maps[type], sha256(content))}`;
  });
}

function replaceByPattern(
  content: string,
  pattern: RegExp,
  type: SensitiveType,
  maps: Record<SensitiveType, Map<string, string>>,
  counts: RedactionCounts,
  seed: string,
): string {
  return content.replace(pattern, (value: string): string => {
    if (isAllowedReplacement(value)) {
      return value;
    }

    incrementCount(counts, type);

    return replacementFor(type, value, maps[type], seed);
  });
}

function replaceIpv6(
  content: string,
  replacements: Map<string, string>,
  counts: RedactionCounts,
  seed: string,
): string {
  return content.replace(ipv6CandidatePattern, (value: string): string => {
    if (!value.includes(":") || isIP(value) !== 6 || isAllowedIpv6(value)) {
      return value;
    }

    incrementCount(counts, "ipv6");

    return replacementFor("ipv6", value.toLowerCase(), replacements, seed);
  });
}

function replaceDomains(
  content: string,
  replacements: Map<string, string>,
  counts: RedactionCounts,
  seed: string,
): string {
  return content.replace(domainPattern, (value: string): string => {
    if (isAllowedDomain(value)) {
      return value;
    }

    incrementCount(counts, "domain");

    return replacementFor("domain", value.toLowerCase(), replacements, seed);
  });
}

function replacementFor(
  type: SensitiveType,
  value: string,
  replacements: Map<string, string>,
  seed: string,
): string {
  const existing = replacements.get(value);

  if (existing !== undefined) {
    return existing;
  }

  const digest = createHash("sha256").update(`${seed}:${type}:${value}`).digest("hex");
  const replacement = createReplacement(type, digest);
  replacements.set(value, replacement);

  return replacement;
}

function createReplacement(type: SensitiveType, digest: string): string {
  switch (type) {
    case "domain":
      return `fixture-${digest.slice(0, 10)}.example.invalid`;
    case "ipv4":
      return `198.51.100.${String((Number.parseInt(digest.slice(0, 2), 16) % 254) + 1)}`;
    case "ipv6":
      return `2001:db8:${digest.slice(0, 4)}:${digest.slice(4, 8)}::1`;
    case "labeledValue":
      return `redacted-${digest.slice(0, 16)}`;
    case "mac":
      return `02:00:00:00:00:${digest.slice(0, 2)}`;
  }
}

function countMatches(
  content: string,
  pattern: RegExp,
  allowed: (value: string) => boolean,
): number {
  pattern.lastIndex = 0;

  return Array.from(content.matchAll(pattern)).filter((match) => !allowed(match[0])).length;
}

function countIpv6(content: string): number {
  ipv6CandidatePattern.lastIndex = 0;

  return Array.from(content.matchAll(ipv6CandidatePattern)).filter((match) => {
    const value = match[0];

    return value.includes(":") && isIP(value) === 6 && !isAllowedIpv6(value);
  }).length;
}

function countLabeledValues(content: string): number {
  labeledValuePattern.lastIndex = 0;

  return Array.from(content.matchAll(labeledValuePattern)).filter((match) => {
    const value = match.groups?.value ?? "";

    return value !== "" && !isAllowedReplacement(value);
  }).length;
}

function countHostLabeledValues(content: string): number {
  hostLabelPattern.lastIndex = 0;

  return Array.from(content.matchAll(hostLabelPattern)).filter((match) => {
    const value = match.groups?.value ?? "";

    return value !== "" && !isAllowedReplacement(value);
  }).length;
}

function isAllowedReplacement(value: string): boolean {
  return (
    /^redacted-[0-9a-f]{16}$/u.test(value) ||
    isAllowedDomain(value) ||
    isAllowedIpv4(value) ||
    isAllowedIpv6(value) ||
    isAllowedMac(value)
  );
}

function isAllowedDomain(value: string): boolean {
  return /^fixture-[0-9a-f]{10}\.example\.invalid$/iu.test(value);
}

function isAllowedIpv4(value: string): boolean {
  return /^198\.51\.100\.(?:[1-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])$/u.test(value);
}

function isAllowedIpv6(value: string): boolean {
  return /^2001:db8:[0-9a-f]{4}:[0-9a-f]{4}::1$/iu.test(value);
}

function isAllowedMac(value: string): boolean {
  return /^02:00:00:00:00:[0-9a-f]{2}$/iu.test(value);
}

function incrementCount(counts: RedactionCounts, type: SensitiveType): void {
  (counts as Record<SensitiveType, number>)[type] += 1;
}
