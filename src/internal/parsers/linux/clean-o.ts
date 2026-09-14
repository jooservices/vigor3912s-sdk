/**
 * Parser for `linux clean -o` (`cli.linux.clean.o`, `classification:
 * "destructive"` in the manifest -- rawLine 12969: "-o - Select this option
 * to reboot Vigor system with current configuration but remove the
 * application(s) related to Linux application from the Vigor router.").
 * See `src/domains/linux.ts`'s module doc comment for how the manifest's
 * `"destructive"` classification maps onto `TypedOperation.classification`.
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseCleanO(text: string): LinuxAck {
  return parseLinuxAck(text);
}
