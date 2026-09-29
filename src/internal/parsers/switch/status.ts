/**
 * Parser for `switch status` (`cli.switch.status`, rawLine 7709).
 *
 * The documented sample output (same rawLine) is three fixed
 * `<label> : <Enable|Disable>` lines describing the router's external-device
 * switch-management toggles -- exactly what the heading's own description
 * promises ("display current switch status"). A line that doesn't match one
 * of the three documented labels is ignored rather than guessed at.
 */

export interface SwitchStatusReport {
  /** Each flag is `null` when its line is missing from the output. */
  readonly autoDiscoveryEnabled: boolean | null;
  readonly noRespondToExternalDeviceEnabled: boolean | null;
  readonly displaySyslogEnabled: boolean | null;
}

const LINE_PATTERN = /^(.*?)\s*:\s*(Enable|Disable)\s*$/;

function findFlag(text: string, label: string): boolean | null {
  for (const rawLine of text.split(/\r?\n/)) {
    const match = LINE_PATTERN.exec(rawLine.trim());

    if (match === null) {
      continue;
    }

    const [, name, state] = match;

    if (name !== undefined && state !== undefined && name.trim().toLowerCase() === label) {
      return state === "Enable";
    }
  }

  return null;
}

export function parseSwitchStatus(text: string): SwitchStatusReport {
  return {
    autoDiscoveryEnabled: findFlag(text, "external device auto discovery status"),
    noRespondToExternalDeviceEnabled: findFlag(text, "no respond to external device"),
    displaySyslogEnabled: findFlag(text, "display external device syslog"),
  };
}
