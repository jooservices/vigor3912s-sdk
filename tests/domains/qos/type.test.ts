import { describe, expect, it } from "vitest";

import { qosType } from "../../../src/domains/qos.js";
import { parseQosType } from "../../../src/internal/parsers/qos/type.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "service name set to draytek\n";

describe("cli.qos.type -- qos type add", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      qosType.buildFrames({
        action: "add",
        name: "draytek",
        protocolType: 6,
        portRange: "510:1330",
      }),
    );

    expect(frame.command).toBe("qos type -a draytek -t 6 -p 510:1330");
    expect(() =>
      qosType.buildFrames({
        action: "add",
        name: "bad name",
        protocolType: 6,
        portRange: "510:1330",
      }),
    ).toThrow(/name/);
    expect(() =>
      qosType.buildFrames({
        action: "add",
        name: "draytek",
        protocolType: 0,
        portRange: "510:1330",
      }),
    ).toThrow(/protocolType/);
    expect(() =>
      qosType.buildFrames({
        action: "add",
        name: "draytek",
        protocolType: 6,
        portRange: "not-a-range",
      }),
    ).toThrow(/portRange must look like/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseQosType(SAMPLE_TEXT)).toEqual({
      raw: "service name set to draytek",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(qosType, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      qosType.buildFrames({
        action: "add",
        name: "draytek",
        protocolType: 6,
        portRange: "510:1330",
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "service name set to draytek");

    expect(qosType.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "service name set to draytek",
    });

    await expectClosedTransportFailure(command);
  });
});
