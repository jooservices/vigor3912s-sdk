import { describe, expect, it } from "vitest";

import { wanMvlan } from "../../../src/domains/wan.js";
import { parseMvlan } from "../../../src/internal/parsers/wan/mvlan.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.mvlan -- wan mvlan <pvc_no> <on/off> [px ...]", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(wanMvlan.buildFrames({ pvcNo: 7, state: "on", ports: [2, 3, 4] }));

    expect(frame.command).toBe("wan mvlan 7 on p2 p3 p4");

    const frameWithoutPorts = firstFrame(wanMvlan.buildFrames({ pvcNo: 7, state: "off" }));

    expect(frameWithoutPorts.command).toBe("wan mvlan 7 off");

    expect(() => wanMvlan.buildFrames({ pvcNo: 1, state: "on" })).toThrow(/pvcNo/);
    expect(() => wanMvlan.buildFrames({ pvcNo: 8, state: "on" })).toThrow(/pvcNo/);
    expect(() => wanMvlan.buildFrames({ pvcNo: 7, state: "maybe" as unknown as "on" })).toThrow(
      /state/,
    );
    expect(() => wanMvlan.buildFrames({ pvcNo: 7, state: "on", ports: [1] })).toThrow(/port/);
  });

  it("parses the documented status output (synthetic sample)", () => {
    expect(parseMvlan("PVC  Bridge   p1   p2 ...\n   7    ON     0    0\n")).toEqual({
      raw: "PVC  Bridge   p1   p2 ...\n   7    ON     0    0",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanMvlan, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      wanMvlan.buildFrames({ pvcNo: 7, state: "on", ports: [2, 3, 4] }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "PVC ...");

    expect(stdout).toBe("PVC ...");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "PVC  Bridge   p1   p2 ...\n   7    ON     0    0\n";

    expect(wanMvlan.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseMvlan(sampleText));
  });
});
