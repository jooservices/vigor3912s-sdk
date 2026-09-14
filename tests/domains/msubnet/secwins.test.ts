import { describe, expect, it } from "vitest";

import { msubnetSecwins } from "../../../src/domains/msubnet.js";
import { parseSecwins } from "../../../src/internal/parsers/msubnet/secwins.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.secwins -- msubnet secWINS", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetSecwins.buildFrames({ lanIndex: 2, winsIp: "192.168.3.89" }));

    expect(frame.command).toBe("msubnet secWINS 2 192.168.3.89");

    expect(() => msubnetSecwins.buildFrames({ lanIndex: 2, winsIp: "not-an-ip" })).toThrow(
      /winsIp/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSecwins("% Set Dhcp Secondary WINS IP done !!!\n")).toEqual({
      raw: "% Set Dhcp Secondary WINS IP done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetSecwins, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetSecwins.buildFrames({ lanIndex: 2, winsIp: "192.168.3.89" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set Dhcp Secondary WINS IP done !!!\n",
    );

    expect(stdout).toBe("% Set Dhcp Secondary WINS IP done !!!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set Dhcp Secondary WINS IP done !!!\n";

    expect(msubnetSecwins.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseSecwins(sampleText),
    );
  });
});
