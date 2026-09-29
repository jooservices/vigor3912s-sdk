import { describe, expect, it } from "vitest";

import { inputSchemaFor, inputSchemas } from "../../src/schemas/index.js";

describe("input schemas spot checks", () => {
  it("cli.ip.addr — a simple required string field", () => {
    expect(inputSchemas["cli.ip.addr"]).toEqual({
      type: "object",
      properties: {
        ipv4Address: { type: "string" },
      },
      required: ["ipv4Address"],
      additionalProperties: false,
    });
  });

  it("cli.ip.arp — a discriminated union of no-field action branches", () => {
    expect(inputSchemas["cli.ip.arp"]).toEqual({
      oneOf: [
        {
          type: "object",
          properties: { action: { const: "status" } },
          required: ["action"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: { action: { const: "acceptStatus" } },
          required: ["action"],
          additionalProperties: false,
        },
      ],
    });
  });

  it("cli.ip.dhcpc — a discriminated union with per-branch fields", () => {
    expect(inputSchemas["cli.ip.dhcpc"]).toEqual({
      oneOf: [
        {
          type: "object",
          properties: { action: { const: "status" } },
          required: ["action"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            action: { const: "release" },
            wanNumber: { type: "integer", minimum: 1, maximum: 12 },
          },
          required: ["action", "wanNumber"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            action: { const: "renew" },
            wanNumber: { type: "integer", minimum: 1, maximum: 12 },
          },
          required: ["action", "wanNumber"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            action: { const: "setOption" },
            enabled: { type: "boolean" },
            wanNumber: { type: "integer", minimum: 1, maximum: 12 },
            optionNumber: { type: "integer", minimum: 0, maximum: 255 },
            value: { type: "string" },
            valueType: {
              type: "string",
              enum: ["string", "hex", "address"],
              description:
                "How `value` is encoded: string (`-v`, default), raw hex (`-x`), address list (`-a`).",
            },
          },
          required: ["action", "enabled", "wanNumber", "optionNumber", "value"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["option", "optionHelp", "optionList", "optionRemoveAll"],
            },
          },
          required: ["action"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            action: { type: "string", enum: ["optionDelete", "optionUpdate"] },
            index: { type: "integer", minimum: 1 },
          },
          required: ["action", "index"],
          additionalProperties: false,
        },
      ],
    });
  });

  it("cli.ddns.set — several plain required fields", () => {
    expect(inputSchemas["cli.ddns.set"]).toEqual({
      type: "object",
      properties: {
        accountIndex: { type: "integer", minimum: 1, maximum: 6 },
        serviceProvider: { type: "integer", minimum: 1, maximum: 19 },
        serviceType: { type: "integer", minimum: 1, maximum: 3 },
        domainName: { type: "string" },
        loginName: { type: "string" },
        password: { type: "string" },
      },
      required: [
        "accountIndex",
        "serviceProvider",
        "serviceType",
        "domainName",
        "loginName",
        "password",
      ],
      additionalProperties: false,
    });
  });

  it("cli.dos — an operation with an array field", () => {
    expect(inputSchemas["cli.dos"]).toEqual({
      type: "object",
      properties: {
        args: { type: "array", items: { type: "string" } },
      },
      required: ["args"],
      additionalProperties: false,
    });
  });

  it("cli.dos.v — a void operation has a null schema", () => {
    expect(inputSchemas["cli.dos.v"]).toBeNull();
  });

  describe("inputSchemaFor", () => {
    it("returns the same schema object as the inputSchemas map for a known id", () => {
      expect(inputSchemaFor("cli.ip.addr")).toEqual(inputSchemas["cli.ip.addr"]);
    });

    it("returns null for a known void operation", () => {
      expect(inputSchemaFor("cli.dos.v")).toBeNull();
    });

    it("returns undefined for an unknown manifestId", () => {
      expect(inputSchemaFor("cli.does.not.exist")).toBeUndefined();
    });
  });

  it("cli.ip.route.add — numeric range read from the domain validator", () => {
    expect(inputSchemaFor("cli.ip.route.add")?.properties?.ifno).toEqual({
      type: "integer",
      minimum: 3,
      maximum: 12,
    });
  });

  it("cli.apm.profile.apply — fixed-length tuple keeps its length", () => {
    expect(inputSchemaFor("cli.apm.profile.apply")?.properties?.clientIndexes).toMatchObject({
      type: "array",
      minItems: 5,
      maxItems: 5,
    });
  });
});
