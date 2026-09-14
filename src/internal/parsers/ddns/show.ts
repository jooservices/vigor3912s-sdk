/**
 * Pure parser for `ddns show -i <value>` (`cli.ddns.show`, rawLine 787).
 * Sample text sourced from the manual's own documented example block
 * (`cli-reference-raw.txt` lines 796-809, `> ddns show -i 1` output) -- no
 * live capture has been imported, consistent with the accepted Task 3
 * fixture-import precedent for synthetic samples.
 *
 * Mirrors `internal/parsers/show/status.ts`'s style: individual field
 * regexes, nullable when the documented line is absent, never throws.
 */

export interface DdnsShowAccount {
  readonly index: number | null;
  readonly enabled: boolean | null;
  readonly wanInterface: string | null;
  readonly serviceProvider: string | null;
  readonly serviceType: string | null;
  readonly domainName: string | null;
  readonly loginName: string | null;
  readonly wildcardsEnabled: boolean | null;
  readonly backupMxEnabled: boolean | null;
  readonly mailExtender: string | null;
  readonly determineRealWanIp: string | null;
}

// Note: the value-capture patterns use `[ \t]*` (not `\s*`) between the
// label and the captured value -- `\s*` would also match the line's own
// trailing newline and bleed into the next documented line for labels with
// an empty value (e.g. "Login Name:" with nothing after it on that line).
const INDEX_PATTERN = /Index:\s*(\d+)/;
const ENABLE_PATTERN = /\[([^\]]*)\]\s*Enable Dynamic DNS Account/;
const WAN_INTERFACE_PATTERN = /WAN Interface:[ \t]*([^\r\n]*)/;
const SERVICE_PROVIDER_PATTERN = /Service Provider:[ \t]*([^\r\n]*)/;
const SERVICE_TYPE_PATTERN = /Service Type:[ \t]*([^\r\n]*)/;
const DOMAIN_NAME_PATTERN = /Domain Name:[ \t]*([^\r\n]*)/;
const LOGIN_NAME_PATTERN = /Login Name:[ \t]*([^\r\n]*)/;
const WILDCARDS_PATTERN = /\[([^\]]*)\]\s*Wildcards/;
const BACKUP_MX_PATTERN = /\[([^\]]*)\]\s*Backup MX/;
const MAIL_EXTENDER_PATTERN = /Mail Extender:[ \t]*([^\r\n]*)/;
const DETERMINE_REAL_WAN_IP_PATTERN = /Determine Real WAN IP:[ \t]*([^\r\n]*)/;

function emptyToNull(value: string | undefined): string | null {
  if (value === undefined || value.trim().length === 0) {
    return null;
  }

  return value.trim();
}

function checkboxToBoolean(value: string | undefined): boolean | null {
  if (value === undefined) {
    return null;
  }

  return value.trim().length > 0;
}

/** Parses `ddns show -i <value>` output into a minimal, honest DTO. Never throws. */
export function parseShow(text: string): DdnsShowAccount {
  const indexMatch = INDEX_PATTERN.exec(text);
  const enableMatch = ENABLE_PATTERN.exec(text);
  const wanInterfaceMatch = WAN_INTERFACE_PATTERN.exec(text);
  const serviceProviderMatch = SERVICE_PROVIDER_PATTERN.exec(text);
  const serviceTypeMatch = SERVICE_TYPE_PATTERN.exec(text);
  const domainNameMatch = DOMAIN_NAME_PATTERN.exec(text);
  const loginNameMatch = LOGIN_NAME_PATTERN.exec(text);
  const wildcardsMatch = WILDCARDS_PATTERN.exec(text);
  const backupMxMatch = BACKUP_MX_PATTERN.exec(text);
  const mailExtenderMatch = MAIL_EXTENDER_PATTERN.exec(text);
  const determineRealWanIpMatch = DETERMINE_REAL_WAN_IP_PATTERN.exec(text);

  return {
    index: indexMatch?.[1] === undefined ? null : Number(indexMatch[1]),
    enabled: checkboxToBoolean(enableMatch?.[1]),
    wanInterface: emptyToNull(wanInterfaceMatch?.[1]),
    serviceProvider: emptyToNull(serviceProviderMatch?.[1]),
    serviceType: emptyToNull(serviceTypeMatch?.[1]),
    domainName: emptyToNull(domainNameMatch?.[1]),
    loginName: emptyToNull(loginNameMatch?.[1]),
    wildcardsEnabled: checkboxToBoolean(wildcardsMatch?.[1]),
    backupMxEnabled: checkboxToBoolean(backupMxMatch?.[1]),
    mailExtender: emptyToNull(mailExtenderMatch?.[1]),
    determineRealWanIp: emptyToNull(determineRealWanIpMatch?.[1]),
  };
}
