import { describe, expect, it } from "vitest";

import { msubnetStartip } from "../../../src/domains/msubnet.js";
import { parseStartip } from "../../../src/internal/parsers/msubnet/startip.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.startip -- msubnet startip", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetStartip.buildFrames({ lanIndex: 2, startIp: "192.168.2.90" }));

    expect(frame.command).toBe("msubnet startip 2 192.168.2.90");

    expect(() => msubnetStartip.buildFrames({ lanIndex: 2, startIp: "not-an-ip" })).toThrow(
      /startIp/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseStartip("% Set Dhcp Start IP done !!!\n")).toEqual({
      raw: "% Set Dhcp Start IP done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetStartip, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetStartip.buildFrames({ lanIndex: 2, startIp: "192.168.2.90" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set Dhcp Start IP done !!!\n",
    );

    expect(stdout).toBe("% Set Dhcp Start IP done !!!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set Dhcp Start IP done !!!\n";

    expect(msubnetStartip.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseStartip(sampleText),
    );
  });
});
