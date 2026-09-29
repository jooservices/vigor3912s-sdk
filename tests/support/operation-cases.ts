import { describe, expect, it } from "vitest";

import { Vigor3912SClient } from "../../src/client.js";
import { operationRegistry } from "../../src/internal/registry/registry.generated.js";
import type { TypedOperation } from "../../src/internal/registry/operation.js";
import { byId } from "../../src/manifest/index.js";
import type { Classification } from "../../src/manifest/types.js";
import { exchange, FakeTransport } from "./fake-transport.js";

/**
 * Table-driven unit tests for one typed operation. Each case proves, for the
 * real public path:
 *   - every `valid` input builds exactly the documented command(s);
 *   - every `invalid` input is rejected by `buildFrames`;
 *   - the operation is the canonical registry descriptor for a manifest
 *     entry with the expected classification;
 *   - `Vigor3912SClient.invoke` dispatches the first valid input through a
 *     fake transport and returns `parse`'s output for `sampleOutput`.
 */
/** The canonical registry operation for `manifestId`, typed by the caller. */
export function registryOperation<TInput>(manifestId: string): TypedOperation<TInput, unknown> {
  const operation = operationRegistry.get(manifestId);

  if (operation === undefined) {
    throw new Error(`No registry operation for "${manifestId}".`);
  }

  return operation as unknown as TypedOperation<TInput, unknown>;
}

export interface OperationCase<TInput> {
  readonly operation: TypedOperation<TInput, unknown>;
  readonly classification: Classification;
  /** `[input, expected command]` — one frame per command, joined by `\n` when multi-frame. */
  readonly valid: readonly (readonly [TInput, string])[];
  /** `[input, expected error message pattern]`. */
  readonly invalid?: readonly (readonly [unknown, RegExp])[];
  readonly sampleOutput?: string;
  /** Expected `invoke` result for `sampleOutput`; defaults to `{ raw: sampleOutput.trim() }`. */
  readonly expectedParse?: unknown;
}

export function describeOperation<TInput>(testCase: OperationCase<TInput>): void {
  const { operation, classification, valid, invalid = [] } = testCase;
  const sampleOutput = testCase.sampleOutput ?? "ok\n";

  describe(`${operation.manifestId} (${classification})`, () => {
    it("builds the documented command for every valid input", () => {
      expect(valid.length).toBeGreaterThan(0);

      for (const [input, command] of valid) {
        const frames = operation.buildFrames(input);

        expect(frames.map((frame) => frame.command).join("\n")).toBe(command);
      }
    });

    if (invalid.length > 0) {
      it("rejects invalid input", () => {
        for (const [input, pattern] of invalid) {
          expect(() => operation.buildFrames(input as TInput)).toThrow(pattern);
        }
      });
    }

    it("is the canonical registry descriptor for its manifest entry", () => {
      const entry = byId(operation.manifestId);

      expect(entry?.kind).toBe("cli-command");
      expect(entry?.classification).toBe(classification);
      expect(entry?.status).toBe("implemented");
      expect(operation.classification).toBe(classification);
      expect(operationRegistry.get(operation.manifestId)).toBe(operation);
    });

    it("invokes through a fake transport and parses the response", async () => {
      const [first] = valid;

      if (first === undefined) {
        throw new Error("at least one valid case is required");
      }

      const [input, command] = first;
      const commandCount = command.split("\n").length;
      const transport = new FakeTransport({
        responses: Array.from({ length: commandCount }, () => exchange(sampleOutput)),
      });
      const client = Vigor3912SClient.fromTransport(transport);

      const result = await client.invoke(operation, input);

      expect(transport.calls.map((call) => call.command).join("\n")).toBe(command);
      expect(result).toEqual(testCase.expectedParse ?? { raw: sampleOutput.trim() });
    });
  });
}
