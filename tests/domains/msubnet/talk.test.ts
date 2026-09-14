import { describe, expect, it } from "vitest";

import { msubnetTalk } from "../../../src/domains/msubnet.js";
import { parseTalk } from "../../../src/internal/parsers/msubnet/talk.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.talk -- msubnet talk", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      msubnetTalk.buildFrames({ firstLanIndex: 1, secondLanIndex: 2, enabled: true }),
    );

    expect(frame.command).toBe("msubnet talk 1 2 On");

    expect(() =>
      msubnetTalk.buildFrames({ firstLanIndex: 0, secondLanIndex: 2, enabled: true }),
    ).toThrow(/firstLanIndex/);
    expect(() =>
      msubnetTalk.buildFrames({ firstLanIndex: 1, secondLanIndex: 101, enabled: true }),
    ).toThrow(/secondLanIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseTalk("% Enable routing between LAN1        and LAN2       !\n")).toEqual({
      raw: "% Enable routing between LAN1        and LAN2       !",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetTalk, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetTalk.buildFrames({ firstLanIndex: 1, secondLanIndex: 2, enabled: true }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Enable routing between LAN1        and LAN2       !\n",
    );

    expect(stdout).toBe("% Enable routing between LAN1        and LAN2       !\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Enable routing between LAN1        and LAN2       !\n";

    expect(msubnetTalk.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseTalk(sampleText));
  });
});
