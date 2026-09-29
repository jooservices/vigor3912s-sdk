import { rmSync } from "node:fs";

import { OPERATION_USAGE_DIR } from "./operation-usage-dir.js";

/** Clears stale usage records before a run so the census only sees this run. */
export default function setup(): void {
  rmSync(OPERATION_USAGE_DIR, { recursive: true, force: true });
}
