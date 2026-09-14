import { describe, expect, it } from "vitest";

import { csmWcf } from "../../../src/domains/csm.js";
import { parseWcf } from "../../../src/internal/parsers/csm/wcf.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

describe("cli.csm.wcf -- csm wcf show|look|cache|server|msg|setdefault|obj INDEX ...", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    expect(firstFrame(csmWcf.buildFrames({ action: "show" })).command).toBe("csm wcf show");
    expect(firstFrame(csmWcf.buildFrames({ action: "look" })).command).toBe("csm wcf look");
    expect(firstFrame(csmWcf.buildFrames({ action: "cache" })).command).toBe("csm wcf cache");
    expect(
      firstFrame(csmWcf.buildFrames({ action: "server", server: "wcf1.draytek.com" })).command,
    ).toBe("csm wcf server wcf1.draytek.com");
    expect(firstFrame(csmWcf.buildFrames({ action: "message", message: "blocked" })).command).toBe(
      "csm wcf msg blocked",
    );
    expect(firstFrame(csmWcf.buildFrames({ action: "setdefault" })).command).toBe(
      "csm wcf setdefault",
    );
    expect(firstFrame(csmWcf.buildFrames({ action: "objView", index: 1 })).command).toBe(
      "csm wcf obj 1 -v",
    );
    expect(
      firstFrame(csmWcf.buildFrames({ action: "objAction", index: 1, value: "B" })).command,
    ).toBe("csm wcf obj 1 -a B");
    expect(
      firstFrame(csmWcf.buildFrames({ action: "objName", index: 1, name: "test_wcf" })).command,
    ).toBe("csm wcf obj 1 -n test_wcf");
    expect(
      firstFrame(csmWcf.buildFrames({ action: "objLog", index: 1, logType: "A" })).command,
    ).toBe("csm wcf obj 1 -l A");

    expect(() => csmWcf.buildFrames({ action: "server", server: "" })).toThrow(/server/);
    expect(() => csmWcf.buildFrames({ action: "objView", index: 9 })).toThrow(/index/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseWcf("Profile Index: 1\nProfile Name:[test_wcf]\n")).toEqual({
      raw: "Profile Index: 1\nProfile Name:[test_wcf]",
    });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(csmWcf.parse([exchange("Profile Index: 1\nProfile Name:[test_wcf]\n")])).toEqual(
      parseWcf("Profile Index: 1\nProfile Name:[test_wcf]\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(csmWcf, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(csmWcf.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Profile Index: 1");

    expect(stdout).toBe("Profile Index: 1");
    await expectClosedTransportFailure(command);
  });
});
