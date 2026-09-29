/** Filesystem locations shared by the manifest/registry/schema generators. */

import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = fileURLToPath(new URL(".", import.meta.url));

export const sdkRoot = path.resolve(toolDir, "..", "..");
export const CLI_RAW_PATH = path.join(sdkRoot, "references", "cli-reference-raw.txt");
export const WEBUI_INDEX_PATH = path.join(sdkRoot, "references", "webui-index.md");
export const GENERATED_OUTPUT_PATH = path.join(
  sdkRoot,
  "src/manifest/capability-manifest.generated.ts",
);
export const DOMAINS_DIR = path.join(sdkRoot, "src/domains");
// Real (non-type-only) runtime import of discovered domain modules must use
// the `tsconfig.generator.json`-compiled output, not raw `src/domains/*.ts`
// -- see `discoverDomainOperations`'s `importDir` doc comment for why.
export const DIST_DOMAINS_DIR = path.join(sdkRoot, "dist/domains");
export const REGISTRY_OUTPUT_PATH = path.join(
  sdkRoot,
  "src/internal/registry/registry.generated.ts",
);
export const OPERATIONS_OUTPUT_PATH = path.join(sdkRoot, "src/operations/index.ts");
export const INPUT_SCHEMAS_OUTPUT_PATH = path.join(
  sdkRoot,
  "src/schemas/input-schemas.generated.ts",
);
