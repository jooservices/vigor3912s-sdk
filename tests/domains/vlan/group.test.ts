import { describe, expect, it } from "vitest";

import { vlanGroup } from "../../../src/domains/vlan.js";
import { parseGroup } from "../../../src/internal/parsers/vlan/group.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vlan.group -- vlan group <id> <add/add_ex/set/set_ex/show> <ports...> (rawLine 9336)", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vlanGroup.buildFrames({ groupId: 3, action: "set", ports: [1, 4] }));

    expect(frame.command).toBe("vlan group 3 set p1 p4");

    const showFrame = firstFrame(vlanGroup.buildFrames({ groupId: 0, action: "show" }));

    expect(showFrame.command).toBe("vlan group 0 show");

    expect(() => vlanGroup.buildFrames({ groupId: 100, action: "set", ports: [1] })).toThrow(
      /groupId/,
    );
    expect(() =>
      vlanGroup.buildFrames({ groupId: 3, action: "banana" as never, ports: [1] }),
    ).toThrow(/action/);
    expect(() => vlanGroup.buildFrames({ groupId: 3, action: "set", ports: [] })).toThrow(/ports/);
    expect(() => vlanGroup.buildFrames({ groupId: 3, action: "set", ports: [13] })).toThrow(/port/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseGroup("% Vlan Group-0 using LAN2       !\n")).toEqual({
      raw: "% Vlan Group-0 using LAN2       !",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanGroup, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      vlanGroup.buildFrames({ groupId: 3, action: "set", ports: [1, 4] }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK.");

    expect(stdout).toBe("OK.");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Vlan Group-0 using LAN2       !\n";

    expect(vlanGroup.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseGroup(sampleText));
  });
});
