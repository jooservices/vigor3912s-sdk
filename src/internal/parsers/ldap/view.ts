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
  readonly enabled: boolean;
  readonly bindType: string;
  readonly sslEnabled: boolean;
  readonly regularDn: string;
  readonly regularPassword: string;
  readonly serverIp: string;
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

function extract(text: string, pattern: RegExp): string {
  const match = pattern.exec(text);

  return match?.[1]?.trim() ?? "";
}

export function parseLdapView(text: string): LdapViewReport {
  const enabledText = extract(text, LINE_PATTERNS.enabled);
  const sslText = extract(text, LINE_PATTERNS.ssl);
  const portText = extract(text, LINE_PATTERNS.serverPort);

  return {
    enabled: enabledText.toLowerCase().startsWith("enabled"),
    bindType: extract(text, LINE_PATTERNS.bindType),
    sslEnabled: sslText.toLowerCase().startsWith("enabled"),
    regularDn: extract(text, LINE_PATTERNS.regularDn),
    regularPassword: extract(text, LINE_PATTERNS.regularPassword),
    serverIp: extract(text, LINE_PATTERNS.serverIp),
    serverPort: portText.length > 0 ? Number(portText) : null,
  };
}
