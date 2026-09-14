/**
 * Parser for `tacacsplus view` (`cli.tacacsplus.view`, rawLine 4152) -- the
 * family's one read operation.
 *
 * Pure `(text: string) => TacacsplusStatusReport` (`ARCHITECTURE.md` Item
 * 5's parser signature). The documented sample output (same rawLine) shows
 * an overall enabled/disabled summary line followed by two fixed
 * "Primary Server"/"Secondary Server" blocks, each with an IP address, port,
 * and type -- exactly what the heading's own example promises. Text that
 * doesn't match the documented shape yields `null` fields rather than a
 * guessed value.
 */

export interface TacacsplusServerStatus {
  readonly ipAddress: string;
  readonly port: number | null;
  readonly type: string;
}

export interface TacacsplusStatusReport {
  readonly enabled: boolean | null;
  readonly primaryServer: TacacsplusServerStatus | null;
  readonly secondaryServer: TacacsplusServerStatus | null;
}

const ENABLED_PATTERN = /External TACACS\+ is (enabled|disabled)/i;

function parseServerBlock(
  text: string,
  heading: "Primary" | "Secondary",
): TacacsplusServerStatus | null {
  const blockPattern = new RegExp(
    `${heading} Server:\\s*\\r?\\n\\s*Server IP Address:\\s*([^\\r\\n]*)\\r?\\n\\s*Port:\\s*([^\\r\\n]*)\\r?\\n\\s*Type:\\s*([^\\r\\n]*)`,
  );
  const match = blockPattern.exec(text);

  if (match === null) {
    return null;
  }

  const ipAddress = match[1]?.trim();
  const portText = match[2]?.trim();
  const type = match[3]?.trim();

  if (ipAddress === undefined || portText === undefined || type === undefined) {
    return null;
  }

  const portNumber = Number.parseInt(portText, 10);

  return {
    ipAddress,
    port: Number.isNaN(portNumber) ? null : portNumber,
    type,
  };
}

export function parseView(text: string): TacacsplusStatusReport {
  const enabledMatch = ENABLED_PATTERN.exec(text);
  const enabledText = enabledMatch?.[1];

  return {
    enabled: enabledText === undefined ? null : enabledText.toLowerCase() === "enabled",
    primaryServer: parseServerBlock(text, "Primary"),
    secondaryServer: parseServerBlock(text, "Secondary"),
  };
}
