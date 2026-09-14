import { describe, expect, it } from "vitest";

import { msubnetPrimwins } from "../../../src/domains/msubnet.js";
import { parsePrimwins } from "../../../src/internal/parsers/msubnet/primwins.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.primwins -- msubnet primWINS", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetPrimwins.buildFrames({ lanIndex: 2, winsIp: "192.168.3.5" }));

    expect(frame.command).toBe("msubnet primWINS 2 192.168.3.5");

    expect(() => msubnetPrimwins.buildFrames({ lanIndex: 2, winsIp: "not-an-ip" })).toThrow(
      /winsIp/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parsePrimwins("% Set Dhcp Primary WINS IP done !!!\n")).toEqual({
      raw: "% Set Dhcp Primary WINS IP done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetPrimwins, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetPrimwins.buildFrames({ lanIndex: 2, winsIp: "192.168.3.5" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set Dhcp Primary WINS IP done !!!\n",
    );

    expect(stdout).toBe("% Set Dhcp Primary WINS IP done !!!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set Dhcp Primary WINS IP done !!!\n";

    expect(msubnetPrimwins.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parsePrimwins(sampleText),
    );
  });
});
