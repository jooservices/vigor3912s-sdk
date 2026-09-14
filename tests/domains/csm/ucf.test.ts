import { describe, expect, it } from "vitest";

import { csmUcf } from "../../../src/domains/csm.js";
import { parseUcf } from "../../../src/internal/parsers/csm/ucf.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

describe("cli.csm.ucf -- csm ucf show|setdefault|msg|obj INDEX ...", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    expect(firstFrame(csmUcf.buildFrames({ action: "show" })).command).toBe("csm ucf show");
    expect(firstFrame(csmUcf.buildFrames({ action: "setdefault" })).command).toBe(
      "csm ucf setdefault",
    );
    expect(
      firstFrame(csmUcf.buildFrames({ action: "message", message: "maintenance" })).command,
    ).toBe("csm ucf msg maintenance");
    expect(
      firstFrame(csmUcf.buildFrames({ action: "objName", index: 1, name: "game" })).command,
    ).toBe("csm ucf obj 1 -n game");
    expect(
      firstFrame(csmUcf.buildFrames({ action: "objPriority", index: 1, value: 0 })).command,
    ).toBe("csm ucf obj 1 -p 0");
    expect(
      firstFrame(csmUcf.buildFrames({ action: "objLog", index: 1, logType: "B" })).command,
    ).toBe("csm ucf obj 1 -l B");

    expect(() => csmUcf.buildFrames({ action: "objName", index: 9, name: "game" })).toThrow(
      /index/,
    );
    expect(() => csmUcf.buildFrames({ action: "objName", index: 1, name: "a".repeat(16) })).toThrow(
      /name/,
    );
    expect(() =>
      csmUcf.buildFrames({ action: "objPriority", index: 1, value: 4 as never }),
    ).toThrow(/value/);
    expect(() => csmUcf.buildFrames({ action: "message", message: "a".repeat(256) })).toThrow(
      /message/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUcf("Profile Index: 1\nProfile Name:[game]\n")).toEqual({
      raw: "Profile Index: 1\nProfile Name:[game]",
    });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(csmUcf.parse([exchange("Profile Index: 1\nProfile Name:[game]\n")])).toEqual(
      parseUcf("Profile Index: 1\nProfile Name:[game]\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(csmUcf, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(csmUcf.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Profile Index: 1");

    expect(stdout).toBe("Profile Index: 1");
    await expectClosedTransportFailure(command);
  });
});
