import { describe, expect, it } from "vitest";

import { csmUcfObjUac } from "../../../src/domains/csm.js";
import { parseUcfObjUac } from "../../../src/internal/parsers/csm/ucf-obj-uac.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

describe("cli.csm.ucf.obj.index.uac -- csm ucf obj INDEX uac ...", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    expect(firstFrame(csmUcfObjUac.buildFrames({ index: 1, action: "view" })).command).toBe(
      "csm ucf obj 1 uac -v",
    );
    expect(firstFrame(csmUcfObjUac.buildFrames({ index: 1, action: "enable" })).command).toBe(
      "csm ucf obj 1 uac -e",
    );
    expect(firstFrame(csmUcfObjUac.buildFrames({ index: 1, action: "disable" })).command).toBe(
      "csm ucf obj 1 uac -d",
    );
    expect(
      firstFrame(csmUcfObjUac.buildFrames({ index: 1, action: "setAction", value: "B" })).command,
    ).toBe("csm ucf obj 1 uac -a B");
    expect(
      firstFrame(csmUcfObjUac.buildFrames({ index: 1, action: "setIpBlock", value: "E" })).command,
    ).toBe("csm ucf obj 1 uac -i E");
    expect(
      firstFrame(csmUcfObjUac.buildFrames({ index: 1, action: "setObject", objectIndex: 1 }))
        .command,
    ).toBe("csm ucf obj 1 uac -o 1");
    expect(
      firstFrame(csmUcfObjUac.buildFrames({ index: 1, action: "setGroup", groupIndex: 2 })).command,
    ).toBe("csm ucf obj 1 uac -g 2");

    expect(() => csmUcfObjUac.buildFrames({ index: 0, action: "view" })).toThrow(/index/);
    expect(() =>
      csmUcfObjUac.buildFrames({ index: 1, action: "setAction", value: "X" as never }),
    ).toThrow(/value/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUcfObjUac("[v]Prevent web access from IP address.\n")).toEqual({
      raw: "[v]Prevent web access from IP address.",
    });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(csmUcfObjUac.parse([exchange("[v]Prevent web access from IP address.\n")])).toEqual(
      parseUcfObjUac("[v]Prevent web access from IP address.\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(csmUcfObjUac, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(csmUcfObjUac.buildFrames({ index: 1, action: "view" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Log:[block]");

    expect(stdout).toBe("Log:[block]");
    await expectClosedTransportFailure(command);
  });
});
