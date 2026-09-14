import { describe, expect, it } from "vitest";

import { msubnetAddr } from "../../../src/domains/msubnet.js";
import { parseAddr } from "../../../src/internal/parsers/msubnet/addr.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.addr -- msubnet addr", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetAddr.buildFrames({ lanIndex: 2, ipAddress: "192.168.5.1" }));

    expect(frame.command).toBe("msubnet addr 2 192.168.5.1");

    expect(() => msubnetAddr.buildFrames({ lanIndex: 1, ipAddress: "192.168.5.1" })).toThrow(
      /lanIndex/,
    );
    expect(() => msubnetAddr.buildFrames({ lanIndex: 2, ipAddress: "not-an-ip" })).toThrow(
      /ipAddress/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseAddr("% Set LAN2 subnet IP address done !!!\n")).toEqual({
      raw: "% Set LAN2 subnet IP address done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetAddr, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetAddr.buildFrames({ lanIndex: 2, ipAddress: "192.168.5.1" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set LAN2 subnet IP address done !!!\n",
    );

    expect(stdout).toBe("% Set LAN2 subnet IP address done !!!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set LAN2 subnet IP address done !!!\n";

    expect(msubnetAddr.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseAddr(sampleText));
  });
});
