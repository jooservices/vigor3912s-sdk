import path from "node:path";
import { fileURLToPath } from "node:url";

/** Where per-test-file operation usage records are written (gitignored). */
export const OPERATION_USAGE_DIR = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  ".op-usage",
);
