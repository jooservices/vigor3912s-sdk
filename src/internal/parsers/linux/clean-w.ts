/**
 * Parser for `linux clean -w` (`cli.linux.clean.w`, `classification:
 * "destructive"` in the manifest -- rawLine 12969: "-w - Wipe out all data
 * of linux service and reboot the router."). See `src/domains/linux.ts`'s
 * module doc comment for how the manifest's `"destructive"` classification
 * maps onto `TypedOperation.classification`.
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseCleanW(text: string): LinuxAck {
  return parseLinuxAck(text);
}
