import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { capabilityManifest } from "../../src/manifest/index.js";
import { LIVE_INVENTORY_EXCLUSIONS } from "../../tools/manifest/live-inventory-exclusions.ts";

/**
 * Live-inventory census (external audit F-1): every family and subcommand
 * that fw 4.4.7_RC2 lists under `?` must map to a manifest entry that is
 * implemented or blocked with a documented reason, or be listed in
 * `LIVE_INVENTORY_EXCLUSIONS`.
 */

interface LiveInventory {
  readonly families: readonly string[];
  readonly subcommands: Readonly<Record<string, readonly string[]>>;
}

const inventory = JSON.parse(
  readFileSync(
    new URL("../../references/live-inventory-fw-4.4.7_RC2.json", import.meta.url),
    "utf-8",
  ),
) as LiveInventory;

/**
 * Every CLI entry is implemented or blocked with a documented reason (the
 * manifest census enforces that), so all of them account for a listing.
 */
const accounted: readonly { readonly path: readonly string[]; readonly command: string }[] =
  capabilityManifest.flatMap((entry) =>
    entry.kind === "cli-command" ? [{ path: entry.commandPath, command: entry.command }] : [],
  );

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** The `?` listing truncates names to 13 characters (`dataflowmonit`). */
function nameMatches(listed: string, token: string): boolean {
  const a = normalize(listed);
  const b = normalize(token);

  return a === b || (listed.length >= 13 && b.startsWith(a));
}

function hasFamily(family: string): boolean {
  return accounted.some((entry) => entry.path[0]?.toLowerCase() === family.toLowerCase());
}

function hasSubcommand(family: string, subcommand: string): boolean {
  return accounted.some((entry) => {
    if (entry.path[0]?.toLowerCase() !== family.toLowerCase()) {
      return false;
    }

    // Position-specific: the listed name must be the first token after the
    // family, in the command path or in any `/`-joined alternative of the
    // command text (`wan mtu / mtu2`, `nand bad /nand usage`).
    const alternatives = entry.command.split("/").map((alternative) => {
      const tokens = alternative.trim().split(/\s+/);
      return tokens[0]?.toLowerCase() === family.toLowerCase() ? tokens[1] : tokens[0];
    });
    const candidates = [entry.path[1], ...alternatives];

    return candidates.some((token) => token !== undefined && nameMatches(subcommand, token));
  });
}

function unmatched(): readonly string[] {
  return [
    ...inventory.families.filter((family) => !hasFamily(family)),
    ...Object.entries(inventory.subcommands).flatMap(([family, subcommands]) =>
      subcommands
        .filter((subcommand) => !hasSubcommand(family, subcommand))
        .map((subcommand) => `${family} ${subcommand}`),
    ),
  ];
}

describe("live inventory census (fw 4.4.7_RC2)", () => {
  it("maps every listed family/subcommand to an SDK entry or a reasoned exclusion", () => {
    const missing = unmatched().filter((key) => !Object.hasOwn(LIVE_INVENTORY_EXCLUSIONS, key));

    expect(missing).toEqual([]);
  });

  it("keeps no exclusion for an entry that is now matched", () => {
    const open = new Set(unmatched());
    const stale = Object.keys(LIVE_INVENTORY_EXCLUSIONS).filter((key) => !open.has(key));

    expect(stale).toEqual([]);
  });

  it("matches the 13-character truncation of the `?` listing", () => {
    expect(nameMatches("dataflowmonit", "dataflowmonitor")).toBe(true);
    expect(nameMatches("NoSecureL2TPM", "NoSecureL2TPMngt")).toBe(true);
    expect(nameMatches("cat", "category")).toBe(false);
  });
});
