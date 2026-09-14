import { describe, expect, it } from "vitest";

import { ipPolicyRt } from "../../../src/domains/ip.js";
import { parsePolicyRt } from "../../../src/internal/parsers/ip/policyrt.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.policyrt -- ip policy_rt", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(
      firstFrame(
        ipPolicyRt.buildFrames({
          args: [
            "-i",
            "-1",
            "-o",
            "add",
            "-1",
            "range",
            "-s",
            "192.168.1.10",
            "-S",
            "192.168.1.20",
            "-2",
            "ip_range",
            "-d",
            "202.211.100.10",
            "-D",
            "202.211.100.20",
            "-g",
            "202.211.100.1",
            "-I",
            "WAN2",
          ],
        }),
      ).command,
    ).toBe(
      "ip policy_rt -i -1 -o add -1 range -s 192.168.1.10 -S 192.168.1.20 -2 ip_range -d 202.211.100.10 -D 202.211.100.20 -g 202.211.100.1 -I WAN2",
    );
    expect(
      firstFrame(
        ipPolicyRt.buildFrames({
          args: ["diagnose", "-s", "192.168.1.100", "-d", "any", "-p", "any", "-t", "ICMP"],
        }),
      ).command,
    ).toBe("ip policy_rt diagnose -s 192.168.1.100 -d any -p any -t ICMP");

    expect(() => ipPolicyRt.buildFrames({ args: [] })).toThrow(/args/);
    expect(() => ipPolicyRt.buildFrames({ args: ["-z", "1"] })).toThrow(/flag/);
    expect(() => ipPolicyRt.buildFrames({ args: ["-i", ""] })).toThrow(
      /must not be empty or whitespace-only/,
    );
    expect(() => ipPolicyRt.buildFrames({ args: ["-i", "1 2"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parsePolicyRt("* No_Match\n")).toEqual({
      raw: "* No_Match",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipPolicyRt, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      ipPolicyRt.buildFrames({
        args: [
          "-i",
          "-1",
          "-o",
          "add",
          "-1",
          "range",
          "-s",
          "192.168.1.10",
          "-S",
          "192.168.1.20",
          "-2",
          "ip_range",
          "-d",
          "202.211.100.10",
          "-D",
          "202.211.100.20",
          "-g",
          "202.211.100.1",
          "-I",
          "WAN2",
        ],
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "* No_Match\n");

    expect(stdout).toBe("* No_Match\n");

    expect(ipPolicyRt.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
