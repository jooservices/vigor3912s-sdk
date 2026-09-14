import { describe, expect, it } from "vitest";

import { msubnetTftp } from "../../../src/domains/msubnet.js";
import { parseTftp } from "../../../src/internal/parsers/msubnet/tftp.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.tftp -- msubnet tftp", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetTftp.buildFrames({ lanIndex: 2, serverName: "publish" }));

    expect(frame.command).toBe("msubnet tftp 2 publish");

    expect(() => msubnetTftp.buildFrames({ lanIndex: 2, serverName: "   " })).toThrow(/serverName/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseTftp("% Set TFTP Server Name done !!!\n")).toEqual({
      raw: "% Set TFTP Server Name done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetTftp, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetTftp.buildFrames({ lanIndex: 2, serverName: "publish" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set TFTP Server Name done !!!\n",
    );

    expect(stdout).toBe("% Set TFTP Server Name done !!!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set TFTP Server Name done !!!\n";

    expect(msubnetTftp.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseTftp(sampleText));
  });
});
