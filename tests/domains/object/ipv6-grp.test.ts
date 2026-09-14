import { describe, expect, it } from "vitest";

import { objectIpv6Grp } from "../../../src/domains/object.js";
import { parseIpv6Grp } from "../../../src/internal/parsers/object/ipv6-grp.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "Set ok!\n";

describe("cli.object.ipv6.grp", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(objectIpv6Grp.buildFrames({ index: 1, name: "marketingtest" }));

    expect(frame.command).toBe("object ipv6 grp 1 -n marketingtest");
    expect(() => objectIpv6Grp.buildFrames({ index: 1, name: "name with space" })).toThrow(/name/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseIpv6Grp(SAMPLE_TEXT)).toEqual({
      raw: "Set ok!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(objectIpv6Grp, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      objectIpv6Grp.buildFrames({ index: 1, name: "marketingtest" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(objectIpv6Grp.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set ok!",
    });

    await expectClosedTransportFailure(command);
  });
});
