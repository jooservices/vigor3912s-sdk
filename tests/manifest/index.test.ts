import { describe, expect, it } from "vitest";

import { byClassification, capabilityManifest, counts } from "../../src/manifest/index.js";

describe("manifest typed accessors", () => {
  it("byClassification returns every entry sharing the requested classification", () => {
    const readEntries = byClassification("read");

    expect(readEntries.length).toBeGreaterThan(0);
    expect(readEntries.length).toBeLessThan(capabilityManifest.length);
    for (const entry of readEntries) {
      expect(entry.classification).toBe("read");
    }

    const expectedCount = capabilityManifest.filter(
      (entry) => entry.classification === "read",
    ).length;

    expect(readEntries).toHaveLength(expectedCount);
    expect(counts.byClassification.read).toBe(expectedCount);
  });
});
