import { describe, expect, it } from "vitest";

import { ipfRule } from "../../../src/domains/ipf.js";
import { parseRule } from "../../../src/internal/parsers/ipf/rule.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ipf.rule -- ipf rule s r [-<command> <parameter> | ...] (write)", () => {
  it("builds the documented frames for each canonical sub-form and rejects invalid input", () => {
    expect(firstFrame(ipfRule.buildFrames({ setNo: 3, ruleNo: 1, action: "view" })).command).toBe(
      "ipf rule 3 1 -v",
    );
    expect(
      firstFrame(ipfRule.buildFrames({ setNo: 3, ruleNo: 1, action: "enable", enabled: true }))
        .command,
    ).toBe("ipf rule 3 1 -e 1");
    expect(
      firstFrame(ipfRule.buildFrames({ setNo: 3, ruleNo: 1, action: "enable", enabled: false }))
        .command,
    ).toBe("ipf rule 3 1 -e 0");
    expect(
      firstFrame(ipfRule.buildFrames({ setNo: 3, ruleNo: 1, action: "direction", direction: 1 }))
        .command,
    ).toBe("ipf rule 3 1 -D 1");

    expect(() => ipfRule.buildFrames({ setNo: 0, ruleNo: 1, action: "view" })).toThrow(/setNo/);
    expect(() => ipfRule.buildFrames({ setNo: 3, ruleNo: 31, action: "view" })).toThrow(/ruleNo/);
    expect(() =>
      ipfRule.buildFrames({
        setNo: 3,
        ruleNo: 1,
        action: "direction",
        direction: 4 as unknown as 0,
      }),
    ).toThrow(/direction/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseRule("> ipf rule 3 1 -e 1\n")).toEqual({ raw: "> ipf rule 3 1 -e 1" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipfRule, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      ipfRule.buildFrames({ setNo: 3, ruleNo: 1, action: "enable", enabled: true }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "> ipf rule 3 1 -e 1");

    expect(ipfRule.parse([{ stdout, stderr: "" }])).toEqual({ raw: "> ipf rule 3 1 -e 1" });

    await expectClosedTransportFailure(command);
  });
});
