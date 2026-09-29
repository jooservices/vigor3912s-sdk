/**
 * Parser for `ipf view` (`cli.ipf.view`, rawLine 3103) -- the family's one
 * read operation.
 *
 * Pure `(text: string) => IpfViewReport` (`ARCHITECTURE.md` Item 5's parser
 * signature). The documented `ipf view -V -d` example (same rawLine) shows
 * five distinct lines: the IP-filter version, the kernel version, whether
 * the filter is running, the current log-flag word plus its description,
 * and the default policy plus whether logging is available. A field whose
 * line doesn't match the documented shape is `null`, never guessed at.
 */

export interface IpfViewReport {
  readonly version: string | null;
  readonly kernelVersion: string | null;
  readonly running: boolean | null;
  readonly logFlags: string | null;
  readonly logFlagsDescription: string | null;
  readonly defaultPolicy: string | null;
  readonly loggingAvailable: boolean | null;
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

  const running = runningMatch?.[1]?.toLowerCase();
  const logging = defaultMatch?.[2]?.trim().toLowerCase();

  return {
    version: versionMatch?.[1]?.trim() ?? null,
    kernelVersion: kernelMatch?.[1]?.trim() ?? null,
    running: running === undefined ? null : running === "yes",
    logFlags: logFlagsMatch?.[1]?.trim() ?? null,
    logFlagsDescription: logFlagsMatch?.[2]?.trim() ?? null,
    defaultPolicy: defaultMatch?.[1]?.trim() ?? null,
    loggingAvailable: logging === undefined ? null : logging === "available",
  };
}
