import { describe, expect, it } from "vitest";

import { qosVoip } from "../../../src/domains/qos.js";
import { parseQosVoip } from "../../../src/internal/parsers/qos/voip.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "QoS for VoIP: Disable; SIP Port: 5060\n";

describe("cli.qos.voip -- qos voip", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(qosVoip.buildFrames({ enabled: false }));

    expect(frame.command).toBe("qos voip off");

    const enabledFrame = firstFrame(qosVoip.buildFrames({ enabled: true }));
    expect(enabledFrame.command).toBe("qos voip on");
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseQosVoip(SAMPLE_TEXT)).toEqual({
      raw: "QoS for VoIP: Disable; SIP Port: 5060",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(qosVoip, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(qosVoip.buildFrames({ enabled: false })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "QoS for VoIP: Disable; SIP Port: 5060",
    );

    expect(qosVoip.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "QoS for VoIP: Disable; SIP Port: 5060",
    });

    await expectClosedTransportFailure(command);
  });
});
