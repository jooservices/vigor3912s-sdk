import { describe, expect, it } from "vitest";

import { Vigor3912SClient } from "../../src/client.js";
import { Vigor3912SError } from "../../src/errors.js";
import { operationRegistry } from "../../src/internal/registry/registry.generated.js";
import { inputSchemaFor, schemaProblem } from "../../src/schemas/index.js";

/**
 * Untyped-input census: JSON from an MCP tool can have any shape. For every
 * operation that takes input, an input its schema rejects must reject with an
 * SDK error before anything is sent — never a `TypeError` crash, never a
 * command.
 */

const MALFORMED: readonly unknown[] = [null, {}, { action: "__not_documented__" }, "text", 7];

describe("operations given malformed untyped input", () => {
  it("reject with an SDK error and send nothing", async () => {
    const sent: string[] = [];
    const client = new Vigor3912SClient({
      run: (command) => {
        sent.push(command);
        return Promise.resolve({ command, stdout: "", stderr: "" });
      },
    });
    const failures: string[] = [];

    for (const [id, operation] of operationRegistry) {
      const schema = inputSchemaFor(id);

      if (schema === null || schema === undefined) {
        continue;
      }

      // `{}` is a valid input where every field is optional (e.g. `ipf view`).
      for (const input of MALFORMED.filter((candidate) => schemaProblem(candidate, schema))) {
        const outcome = await client.invoke(operation, input as never).then(
          () => "resolved",
          (error: unknown) => (error instanceof Vigor3912SError ? "sdk-error" : String(error)),
        );

        if (outcome !== "sdk-error") {
          failures.push(`${id} ${JSON.stringify(input)} -> ${outcome}`);
        }
      }
    }

    expect(failures).toEqual([]);
    expect(sent).toEqual([]);
  });
});
