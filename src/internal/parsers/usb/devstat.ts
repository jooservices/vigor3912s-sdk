/**
 * Parser for `usb devstat` (`cli.usb.devstat`, rawLine 9154).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5). Sample response shape taken
 * verbatim from the documented example at that rawLine:
 *
 * ```
 * USB Port1: No device
 * USB Port2: No device
 * ```
 */

export interface UsbPortStatus {
  readonly port: number;
  readonly status: string;
}

export interface UsbDeviceStatusReport {
  readonly ports: readonly UsbPortStatus[];
}

const PORT_LINE_PATTERN = /USB\s*Port\s*(\d+)\s*:\s*(.+)/i;

export function parseDevstat(text: string): UsbDeviceStatusReport {
  const ports = text
    .split(/\r?\n/)
    .map((line) => PORT_LINE_PATTERN.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({ port: Number(match[1]), status: (match[2] ?? "").trim() }));

  return { ports };
}
