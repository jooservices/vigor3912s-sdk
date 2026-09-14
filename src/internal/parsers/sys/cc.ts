/**
 * Pure parser for `sys cc` (`cli.sys.cc`, classification "read").
 *
 * Sample text (`cli-reference-raw.txt`, rawLine 8074):
 * ```
 * Country Code        : 0x 0 [International]
 * Wireless Region Code: 0x30
 * ```
 */

export interface SysCc {
  readonly countryCode: string;
  readonly wirelessRegionCode: string;
}

const COUNTRY_PATTERN = /Country Code\s*:\s*(?<countryCode>.+?)\s*$/m;
const REGION_PATTERN = /Wireless Region Code\s*:\s*(?<wirelessRegionCode>.+?)\s*$/m;

export function parseSysCc(text: string): SysCc {
  const countryMatch = COUNTRY_PATTERN.exec(text);
  const regionMatch = REGION_PATTERN.exec(text);

  return {
    countryCode: countryMatch?.groups?.countryCode ?? "",
    wirelessRegionCode: regionMatch?.groups?.wirelessRegionCode ?? "",
  };
}
