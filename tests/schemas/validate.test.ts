import { describe, expect, it } from "vitest";

import { schemaProblem, type JsonSchema } from "../../src/schemas/index.js";

const schema: JsonSchema = {
  type: "object",
  properties: {
    action: { const: "set" },
    mode: { type: "string", enum: ["on", "off"] },
    index: { type: "integer", minimum: 1, maximum: 4 },
    ratio: { type: "number" },
    enabled: { type: "boolean" },
    pair: { type: "array", items: { type: "integer" }, minItems: 2, maxItems: 2 },
    tags: { type: "array" },
    timeout: { oneOf: [{ const: -1 }, { type: "integer", minimum: 1 }] },
  },
  required: ["action", "index"],
  additionalProperties: false,
};

const valid = { action: "set", index: 2 };

describe("schemaProblem", () => {
  it("accepts a conforming input, ignoring explicitly undefined optional fields", () => {
    expect(
      schemaProblem(
        {
          ...valid,
          mode: "on",
          ratio: 0.5,
          enabled: false,
          pair: [1, 2],
          tags: ["x"],
          timeout: -1,
        },
        schema,
      ),
    ).toBeUndefined();
    expect(schemaProblem({ ...valid, mode: undefined }, schema)).toBeUndefined();
  });

  it.each([
    [null, "input must be of type object."],
    [[1], "input must be of type object."],
    [{ index: 2 }, "input.action is required."],
    [{ ...valid, action: "del" }, 'input.action must be "set".'],
    [{ ...valid, mode: "auto" }, 'input.mode must be one of "on", "off".'],
    [{ ...valid, index: 1.5 }, "input.index must be of type integer."],
    [{ ...valid, index: 0 }, "input.index must be at least 1."],
    [{ ...valid, index: 5 }, "input.index must be at most 4."],
    [{ ...valid, ratio: Number.NaN }, "input.ratio must be of type number."],
    [{ ...valid, enabled: "true" }, "input.enabled must be of type boolean."],
    [{ ...valid, pair: [1] }, "input.pair must have at least 2 entries."],
    [{ ...valid, pair: [1, 2, 3] }, "input.pair must have at most 2 entries."],
    [{ ...valid, pair: [1, "2"] }, "input.pair[1] must be of type integer."],
    [{ ...valid, tags: "x" }, "input.tags must be of type array."],
    [{ ...valid, timeout: 0 }, "input.timeout does not match any documented form."],
    [{ ...valid, extra: 1 }, "input.extra is not a documented field."],
  ])("rejects %j", (input, message) => {
    expect(schemaProblem(input, schema)).toBe(message);
  });

  it("allows undeclared fields when additionalProperties is not false", () => {
    expect(schemaProblem({ extra: 1 }, { type: "object" })).toBeUndefined();
  });

  it("never echoes a rejected value", () => {
    expect(schemaProblem({ ...valid, mode: "s3cret" }, schema)).not.toContain("s3cret");
  });
});
