import { describe, expect, it } from "vitest";

import { msubnetGateway } from "../../../src/domains/msubnet.js";
import { parseGateway } from "../../../src/internal/parsers/msubnet/gateway.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.gateway -- msubnet gateway", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      msubnetGateway.buildFrames({ lanIndex: 2, gatewayIp: "192.168.1.13" }),
    );

    expect(frame.command).toBe("msubnet gateway 2 192.168.1.13");

    expect(() => msubnetGateway.buildFrames({ lanIndex: 2, gatewayIp: "not-an-ip" })).toThrow(
      /gatewayIp/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseGateway("% Set LAN2 Dhcp Gateway IP done !!!\n")).toEqual({
      raw: "% Set LAN2 Dhcp Gateway IP done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetGateway, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetGateway.buildFrames({ lanIndex: 2, gatewayIp: "192.168.1.13" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set LAN2 Dhcp Gateway IP done !!!\n",
    );

    expect(stdout).toBe("% Set LAN2 Dhcp Gateway IP done !!!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set LAN2 Dhcp Gateway IP done !!!\n";

    expect(msubnetGateway.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseGateway(sampleText),
    );
  });
});
