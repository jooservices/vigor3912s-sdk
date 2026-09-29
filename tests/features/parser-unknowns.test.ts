import { describe, expect, it } from "vitest";

import { operationRegistry } from "../../src/internal/registry/registry.generated.js";

/**
 * Parser census: fed output it cannot recognize, a read parser must say
 * "unknown" (`null`, an empty list, or the raw text) — never a concrete
 * `false` or `""` that a consumer would read as a real router answer.
 */

function guessedLeaves(value: unknown, path = "$"): readonly string[] {
  if (value === false || value === "") {
    return [path];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => guessedLeaves(entry, `${path}[${String(index)}]`));
  }

  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) =>
      key === "raw" ? [] : guessedLeaves(entry, `${path}.${key}`),
    );
  }

  return [];
}

describe("read parsers on unrecognized output", () => {
  it("never report a guessed false or empty string", () => {
    const guessed = [...operationRegistry.values()]
      .filter((operation) => operation.classification === "read")
      .flatMap((operation) =>
        guessedLeaves(operation.parse([{ stdout: "unrecognized\noutput", stderr: "" }])).map(
          (path) => `${operation.manifestId} ${path}`,
        ),
      );

    expect(guessed).toEqual([]);
  });
});
