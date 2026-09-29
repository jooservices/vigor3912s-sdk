/**
 * Pure parser for `sys version` (`cli.sys.version`, classification "read").
 *
 * Sample text (`.ai/skills/vigor3912s/references/command-map.md`'s
 * "sys version example output" block):
 * ```
 * Router Model: Vigor3912S    Version: 4.3.5 zh_TW zh_CN
 * Profile version: 4.0.7    Status: 1 (0x14bc0da9)
 * Router IP: 192.168.1.1    Netmask: 255.255.255.0
 * Firmware Build Date/Time: Nov 13 2023 16:38:20
 * Router Name: DrayTek
 * Revision: 3682_4564_a39c288 V400_RD3
 * ```
 */

/** Each field is `null` when its label is missing from the output. */
export interface SysVersion {
  readonly routerModel: string | null;
  readonly version: string | null;
  readonly profileVersion: string | null;
  readonly status: string | null;
  readonly routerIp: string | null;
  readonly netmask: string | null;
  readonly firmwareBuildDateTime: string | null;
  readonly routerName: string | null;
  readonly revision: string | null;
}

function extract(text: string, pattern: RegExp): string | null {
  return pattern.exec(text)?.groups?.value?.trim() ?? null;
}

export function parseSysVersion(text: string): SysVersion {
  return {
    routerModel: extract(text, /Router Model:\s*(?<value>.+?)\s{2,}Version:/),
    version: extract(text, /Version:\s*(?<value>.+?)\s*$/m),
    profileVersion: extract(text, /Profile version:\s*(?<value>.+?)\s{2,}Status:/),
    status: extract(text, /Status:\s*(?<value>.+?)\s*$/m),
    routerIp: extract(text, /Router IP:\s*(?<value>.+?)\s{2,}Netmask:/),
    netmask: extract(text, /Netmask:\s*(?<value>.+?)\s*$/m),
    firmwareBuildDateTime: extract(text, /Firmware Build Date\/Time:\s*(?<value>.+?)\s*$/m),
    routerName: extract(text, /Router Name:\s*(?<value>.+?)\s*$/m),
    revision: extract(text, /Revision:\s*(?<value>.+?)\s*$/m),
  };
}
