/**
 * Pure parser for `sys health <metric>` (`cli.sys.health`, classification
 * "read"). Each of the eight documented metrics (`cpu_usage`, `mem_usage`,
 * `arp_status`, `dos_status`, `sess_usage`, `view`, `vpn_status`,
 * `voip_status`) has its own distinct, wide table layout (rawLine 8336
 * onward). Structuring all eight shapes now would be speculative (YAGNI);
 * this returns the trimmed raw text, a real (if minimal) transform.
 */

export interface SysHealth {
  readonly raw: string;
}

export function parseSysHealth(text: string): SysHealth {
  return { raw: text.trim() };
}
