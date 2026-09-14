import { describe, expect, it } from "vitest";

import { csmUcfObjEac } from "../../../src/domains/csm.js";
import { parseUcfObjEac } from "../../../src/internal/parsers/csm/ucf-obj-eac.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

describe("cli.csm.ucf.obj.index.eac -- csm ucf obj INDEX eac ...", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    expect(firstFrame(csmUcfObjEac.buildFrames({ index: 1, action: "view" })).command).toBe(
      "csm ucf obj 1 eac -v",
    );
    expect(firstFrame(csmUcfObjEac.buildFrames({ index: 1, action: "enable" })).command).toBe(
      "csm ucf obj 1 eac -e",
    );
    expect(firstFrame(csmUcfObjEac.buildFrames({ index: 1, action: "disable" })).command).toBe(
      "csm ucf obj 1 eac -d",
    );
    expect(
      firstFrame(csmUcfObjEac.buildFrames({ index: 1, action: "setObject", objectIndex: 1 }))
        .command,
    ).toBe("csm ucf obj 1 eac -o 1");
    expect(
      firstFrame(csmUcfObjEac.buildFrames({ index: 1, action: "setGroup", groupIndex: 2 })).command,
    ).toBe("csm ucf obj 1 eac -g 2");

    expect(() => csmUcfObjEac.buildFrames({ index: 9, action: "view" })).toThrow(/index/);
    expect(() =>
      csmUcfObjEac.buildFrames({ index: 1, action: "setObject", objectIndex: 0 }),
    ).toThrow(/objectIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUcfObjEac("[v]Enable Exception List\n")).toEqual({
      raw: "[v]Enable Exception List",
    });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(csmUcfObjEac.parse([exchange("[v]Enable Exception List\n")])).toEqual(
      parseUcfObjEac("[v]Enable Exception List\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(csmUcfObjEac, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(csmUcfObjEac.buildFrames({ index: 1, action: "enable" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "[v]Enable Exception List");

    expect(stdout).toBe("[v]Enable Exception List");
    await expectClosedTransportFailure(command);
  });
});
