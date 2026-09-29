/**
 * Parser for `ldap view` (`cli.ldap.view`, rawLine 4107) -- the family's one
 * read operation.
 *
 * Pure `(text: string) => LdapViewReport` (`ARCHITECTURE.md` Item 5's parser
 * signature). The documented sample output (same rawLine, `EExxaammppllee` block)
 * shows a fixed set of `Label:value` lines -- exactly what this parser
 * extracts; a missing/unmatched line falls back to an empty string (or
 * `null` for the numeric port) rather than guessing at undocumented shape.
 */

export interface LdapViewReport {
  /** Each field is `null` when its line is missing (or, for the port, not a number). */
  readonly enabled: boolean | null;
  readonly bindType: string | null;
  readonly sslEnabled: boolean | null;
  readonly regularDn: string | null;
  readonly regularPassword: string | null;
  readonly serverIp: string | null;
  readonly serverPort: number | null;
}

const LINE_PATTERNS = {
  enabled: /^LDAP Enable:(.*)$/m,
  bindType: /^LDAP Bind Type:(.*)$/m,
  ssl: /^LDAP with SSL:(.*)$/m,
  regularDn: /^LDAP Regular DN:(.*)$/m,
  regularPassword: /^LDAP Regular Password:(.*)$/m,
  serverIp: /^LDAP Server IP:(.*)$/m,
  serverPort: /^LDAP Server Port:(.*)$/m,
} as const;

function extract(text: string, pattern: RegExp): string | null {
  const match = pattern.exec(text);

  return match?.[1]?.trim() ?? null;
}

function enabledFlag(text: string | null): boolean | null {
  return text === null ? null : text.toLowerCase().startsWith("enabled");
}

export function parseLdapView(text: string): LdapViewReport {
  const enabledText = extract(text, LINE_PATTERNS.enabled);
  const sslText = extract(text, LINE_PATTERNS.ssl);
  const portText = extract(text, LINE_PATTERNS.serverPort);

  return {
    enabled: enabledFlag(enabledText),
    bindType: extract(text, LINE_PATTERNS.bindType),
    sslEnabled: enabledFlag(sslText),
    regularDn: extract(text, LINE_PATTERNS.regularDn),
    regularPassword: extract(text, LINE_PATTERNS.regularPassword),
    serverIp: extract(text, LINE_PATTERNS.serverIp),
    serverPort: portText !== null && /^\d+$/.test(portText) ? Number(portText) : null,
  };
}
