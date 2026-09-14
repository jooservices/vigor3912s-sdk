import { describe, expect, it } from "vitest";

import { msubnetLeasetime } from "../../../src/domains/msubnet.js";
import { parseLeasetime } from "../../../src/internal/parsers/msubnet/leasetime.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.leasetime -- msubnet leasetime", () => {
  it("builds the documented frame (with and without the optional lease time) and rejects invalid input", () => {
    const frameWithValue = firstFrame(
      msubnetLeasetime.buildFrames({ lanIndex: 1, leaseTimeSec: 86_400 }),
    );
    expect(frameWithValue.command).toBe("msubnet leasetime 1 86400");

    const frameWithoutValue = firstFrame(msubnetLeasetime.buildFrames({ lanIndex: 1 }));
    expect(frameWithoutValue.command).toBe("msubnet leasetime 1");

    expect(() => msubnetLeasetime.buildFrames({ lanIndex: 0 })).toThrow(/lanIndex/);
    expect(() => msubnetLeasetime.buildFrames({ lanIndex: 101 })).toThrow(/lanIndex/);
    expect(() => msubnetLeasetime.buildFrames({ lanIndex: 1, leaseTimeSec: 0 })).toThrow(
      /leaseTimeSec/,
    );
    expect(() => msubnetLeasetime.buildFrames({ lanIndex: 1, leaseTimeSec: 259_201 })).toThrow(
      /leaseTimeSec/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseLeasetime("% Set LAN1 lease time: 259200\n")).toEqual({
      raw: "% Set LAN1 lease time: 259200",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetLeasetime, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      msubnetLeasetime.buildFrames({ lanIndex: 1, leaseTimeSec: 259_200 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set LAN1 lease time: 259200\n",
    );

    expect(stdout).toBe("% Set LAN1 lease time: 259200\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set LAN1 lease time: 259200\n";

    expect(msubnetLeasetime.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseLeasetime(sampleText),
    );
  });
});
