import { describe, expect, it } from "vitest";

import { msubnetIpcnt } from "../../../src/domains/msubnet.js";
import { parseIpcnt } from "../../../src/internal/parsers/msubnet/ipcnt.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.ipcnt -- msubnet ipcnt", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetIpcnt.buildFrames({ lanIndex: 2, ipCount: 15 }));

    expect(frame.command).toBe("msubnet ipcnt 2 15");

    expect(() => msubnetIpcnt.buildFrames({ lanIndex: 2, ipCount: -1 })).toThrow(/ipCount/);
    expect(() => msubnetIpcnt.buildFrames({ lanIndex: 2, ipCount: 221 })).toThrow(/ipCount/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIpcnt("This setting will take effect after rebooting.\n")).toEqual({
      raw: "This setting will take effect after rebooting.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetIpcnt, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(msubnetIpcnt.buildFrames({ lanIndex: 2, ipCount: 15 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "This setting will take effect after rebooting.\n",
    );

    expect(stdout).toBe("This setting will take effect after rebooting.\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "This setting will take effect after rebooting.\n";

    expect(msubnetIpcnt.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseIpcnt(sampleText),
    );
  });
});
