import { describe, expect, it } from "vitest";

import { liveReadOnlyAllowlist } from "../../src/live/allowlist.js";
import { byId } from "../../src/manifest/index.js";

/**
 * Safety cross-check, not a smoke test: per `ARCHITECTURE.md`'s Item 4, the
 * hand-maintained `liveReadOnlyAllowlist` is only one of two independent
 * gates on live-callable operations. This test guarantees the other gate
 * (the generated manifest) still agrees with it — if the manifest is ever
 * regenerated with one of these ids reclassified away from `"read"` (or the
 * id disappears), this test must fail loudly rather than let the allowlist
 * silently drift out of sync with the manifest.
 */
describe("liveReadOnlyAllowlist", () => {
  it.each(liveReadOnlyAllowlist)("id %s exists in the generated manifest", (id) => {
    expect(byId(id)).toBeDefined();
  });

  it.each(liveReadOnlyAllowlist)('id %s is classified "read" in the generated manifest', (id) => {
    const entry = byId(id);

    expect(entry?.classification).toBe("read");
  });

  it("contains no duplicate ids", () => {
    const unique = new Set(liveReadOnlyAllowlist);

    expect(unique.size).toBe(liveReadOnlyAllowlist.length);
  });

  it("is non-empty", () => {
    expect(liveReadOnlyAllowlist.length).toBeGreaterThan(0);
  });
});
