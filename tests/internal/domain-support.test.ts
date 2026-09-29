import { describe, expect, it } from "vitest";

import { InvalidInputError } from "../../src/errors.js";
import {
  assertCliValue,
  assertMac,
  assertOneOf,
  assertParamTail,
  assertSingleToken,
  assertTrailingText,
} from "../../src/internal/domain-support.js";

function messageOf(action: () => void): string {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidInputError);
    return (error as InvalidInputError).message;
  }

  throw new Error("expected the validator to throw");
}

describe("assertSingleToken", () => {
  it.each([
    ["", /must not be empty/],
    ["two words", /must not contain whitespace/],
    ['a"b', /double quote/],
    ["a;b", /shell metacharacters/],
    ["a$(b)", /shell metacharacters/],
  ])("rejects %j", (value, pattern) => {
    expect(
      messageOf(() => {
        assertSingleToken(value, "field");
      }),
    ).toMatch(pattern);
  });

  it("never echoes the rejected value (it may be a secret)", () => {
    expect(
      messageOf(() => {
        assertSingleToken("s3cret pass", "password");
      }),
    ).not.toContain("s3cret");
  });

  it("accepts a plain token", () => {
    expect(() => {
      assertSingleToken("p@ss-w0rd", "password");
    }).not.toThrow();
  });
});

describe("assertCliValue", () => {
  it("rejects a flag-like value", () => {
    expect(
      messageOf(() => {
        assertCliValue("-c", "name");
      }),
    ).toMatch(/must not start with "-"/);
  });

  it("accepts a value with an inner dash", () => {
    expect(() => {
      assertCliValue("lan-1", "name");
    }).not.toThrow();
  });
});

describe("assertTrailingText", () => {
  it("accepts documented multi-word text", () => {
    expect(() => {
      assertTrailingText("just for test", "comment");
    }).not.toThrow();
  });

  it.each(["hello -d 1", '"quoted"', "  "])("rejects %j", (value) => {
    expect(() => {
      assertTrailingText(value, "comment");
    }).toThrow(InvalidInputError);
  });
});

describe("assertParamTail", () => {
  it("accepts a tail within its documented grammar", () => {
    expect(() => {
      assertParamTail("mode 1", "param", { firstToken: ["mode", "show"] });
      assertParamTail("12", "param", { firstToken: ["l2lidx"], allowIntegerFirst: true });
      assertParamTail("-i 1 -e 2", "param", { flags: ["-i", "-e"] });
      assertParamTail("pname=x idle=100", "param", { tokenPattern: /^\w+=\S*$/ });
      assertParamTail("anything -x", "param", { flags: "any" });
    }).not.toThrow();
  });

  it.each([
    ["", {}, /not blank/],
    ["x".repeat(256), {}, /1-255 characters/],
    ['mode "1"', {}, /double quotes/],
    ["mode 1; reboot", {}, /shell metacharacters/],
    ["reboot", { firstToken: ["mode"] }, /must start with one of mode\./],
    ["x", { firstToken: ["l2lidx"], allowIntegerFirst: true }, /or an integer/],
    ["mode -x", {}, /starting with "-"/],
    ["-i 1 -z", { flags: ["-i"] }, /flag must be one of -i/],
    ["idle", { tokenPattern: /^\w+=\S*$/ }, /tokens must match/],
  ] as const)("rejects %j", (value, grammar, pattern) => {
    expect(
      messageOf(() => {
        assertParamTail(value, "param", grammar);
      }),
    ).toMatch(pattern);
  });
});

describe("assertMac", () => {
  it.each([
    ["00:1d:aa:11:22:33", "colon"],
    ["00-1D-AA-11-22-33", "dash"],
    ["00-1d-aa-11-22-33", "colonOrDash"],
    ["001daa112233", "bare"],
  ] as const)("accepts %s as %s", (value, format) => {
    expect(() => {
      assertMac(value, "mac", format);
    }).not.toThrow();
  });

  it("names the documented notation", () => {
    expect(
      messageOf(() => {
        assertMac("001daa112233", "mac", "dash");
      }),
    ).toMatch(/XX-XX-XX-XX-XX-XX/);
  });
});

describe("assertOneOf", () => {
  it("handles numeric literal unions", () => {
    expect(() => {
      assertOneOf(3, [1, 2], "value");
    }).toThrow(/must be one of 1, 2 \(got 3\)/);
  });
});
