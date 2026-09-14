/**
 * Parser for `ipf view` (`cli.ipf.view`, rawLine 3103) -- the family's one
 * read operation.
 *
 * Pure `(text: string) => IpfViewReport` (`ARCHITECTURE.md` Item 5's parser
 * signature). The documented `ipf view -V -d` example (same rawLine) shows
 * five distinct lines: the IP-filter version, the kernel version, whether
 * the filter is running, the current log-flag word plus its description,
 * and the default policy plus whether logging is available. Every field is
 * optional -- a line that doesn't match the documented shape is simply
 * omitted rather than guessed at.
 */

export interface IpfViewReport {
  readonly version?: string;
  readonly kernelVersion?: string;
  readonly running?: boolean;
  readonly logFlags?: string;
  readonly logFlagsDescription?: string;
  readonly defaultPolicy?: string;
  readonly loggingAvailable?: boolean;
}

const VERSION_PATTERN = /ipf:\s*IP Filter:\s*([^\r\n]+)/;
const KERNEL_PATTERN = /Kernel:\s*IP Filter:\s*([^\r\n]+)/;
const RUNNING_PATTERN = /Running:\s*(yes|no)/i;
const LOG_FLAGS_PATTERN = /Log Flags:\s*(\S+)\s*=\s*([^\r\n]+)/;
const DEFAULT_PATTERN = /Default:\s*([^,]+),\s*Logging:\s*([^\r\n]+)/;

export function parseView(text: string): IpfViewReport {
  const versionMatch = VERSION_PATTERN.exec(text);
  const kernelMatch = KERNEL_PATTERN.exec(text);
  const runningMatch = RUNNING_PATTERN.exec(text);
  const logFlagsMatch = LOG_FLAGS_PATTERN.exec(text);
  const defaultMatch = DEFAULT_PATTERN.exec(text);

  const report: {
    version?: string;
    kernelVersion?: string;
    running?: boolean;
    logFlags?: string;
    logFlagsDescription?: string;
    defaultPolicy?: string;
    loggingAvailable?: boolean;
  } = {};

  if (versionMatch?.[1] !== undefined) {
    report.version = versionMatch[1].trim();
  }

  if (kernelMatch?.[1] !== undefined) {
    report.kernelVersion = kernelMatch[1].trim();
  }

  if (runningMatch?.[1] !== undefined) {
    report.running = runningMatch[1].toLowerCase() === "yes";
  }

  if (logFlagsMatch?.[1] !== undefined && logFlagsMatch[2] !== undefined) {
    report.logFlags = logFlagsMatch[1].trim();
    report.logFlagsDescription = logFlagsMatch[2].trim();
  }

  if (defaultMatch?.[1] !== undefined && defaultMatch[2] !== undefined) {
    report.defaultPolicy = defaultMatch[1].trim();
    report.loggingAvailable = defaultMatch[2].trim().toLowerCase() === "available";
  }

  return report;
}
