import { describe, expect, it } from "vitest";

import { main } from "../../tools/import-redacted-fixture.ts";

describe("tools/import-redacted-fixture main", () => {
  it("delegates to the built fixture importer and surfaces its argument validation", async () => {
    await expect(main(["--input"])).rejects.toThrow(/Usage: npm run fixtures:import/);
    await expect(main(["--input", "a", "--output", "b"])).rejects.toThrow(
      /--input, --output, and --provenance are required/,
    );
  });
});
