import { describe, expect, it } from "vitest";

import { msubnetNmask } from "../../../src/domains/msubnet.js";
import { parseNmask } from "../../../src/internal/parsers/msubnet/nmask.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.nmask -- msubnet nmask", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetNmask.buildFrames({ lanIndex: 2, netmask: "255.255.0.0" }));

    expect(frame.command).toBe("msubnet nmask 2 255.255.0.0");

    expect(() => msubnetNmask.buildFrames({ lanIndex: 101, netmask: "255.255.0.0" })).toThrow(
      /lanIndex/,
    );
    expect(() => msubnetNmask.buildFrames({ lanIndex: 2, netmask: "bad" })).toThrow(/netmask/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseNmask("% Set LAN2 subnet mask done !!!\n")).toEqual({
      raw: "% Set LAN2 subnet mask done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetNmask, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetNmask.buildFrames({ lanIndex: 2, netmask: "255.255.0.0" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set LAN2 subnet mask done !!!\n",
    );

    expect(stdout).toBe("% Set LAN2 subnet mask done !!!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set LAN2 subnet mask done !!!\n";

    expect(msubnetNmask.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseNmask(sampleText),
    );
  });
});
