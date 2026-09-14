import { describe, expect, it } from "vitest";

import { csmUcfObjWf } from "../../../src/domains/csm.js";
import { parseUcfObjWf } from "../../../src/internal/parsers/csm/ucf-obj-wf.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

describe("cli.csm.ucf.obj.index.wf -- csm ucf obj INDEX wf ...", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    expect(firstFrame(csmUcfObjWf.buildFrames({ index: 1, action: "view" })).command).toBe(
      "csm ucf obj 1 wf -v",
    );
    expect(firstFrame(csmUcfObjWf.buildFrames({ index: 1, action: "enable" })).command).toBe(
      "csm ucf obj 1 wf -e",
    );
    expect(firstFrame(csmUcfObjWf.buildFrames({ index: 1, action: "disable" })).command).toBe(
      "csm ucf obj 1 wf -d",
    );
    expect(
      firstFrame(csmUcfObjWf.buildFrames({ index: 1, action: "setAction", value: "P" })).command,
    ).toBe("csm ucf obj 1 wf -a P");
    expect(
      firstFrame(csmUcfObjWf.buildFrames({ index: 1, action: "enableFeature", feature: "c" }))
        .command,
    ).toBe("csm ucf obj 1 wf -s c");
    expect(
      firstFrame(csmUcfObjWf.buildFrames({ index: 1, action: "cancelFeature", feature: "u" }))
        .command,
    ).toBe("csm ucf obj 1 wf -u u");
    expect(
      firstFrame(
        csmUcfObjWf.buildFrames({ index: 1, action: "setFileExtension", fileExtensionIndex: 8 }),
      ).command,
    ).toBe("csm ucf obj 1 wf -f 8");

    expect(() =>
      csmUcfObjWf.buildFrames({ index: 1, action: "enableFeature", feature: "x" as never }),
    ).toThrow(/feature/);
    expect(() =>
      csmUcfObjWf.buildFrames({ index: 1, action: "setFileExtension", fileExtensionIndex: 9 }),
    ).toThrow(/fileExtensionIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseUcfObjWf("[V] Cookie [ ] Proxy [ ] Upload\n")).toEqual({
      raw: "[V] Cookie [ ] Proxy [ ] Upload",
    });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(csmUcfObjWf.parse([exchange("[V] Cookie [ ] Proxy [ ] Upload\n")])).toEqual(
      parseUcfObjWf("[V] Cookie [ ] Proxy [ ] Upload\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(csmUcfObjWf, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      csmUcfObjWf.buildFrames({ index: 1, action: "enableFeature", feature: "c" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "[V] Cookie [ ] Proxy [ ] Upload",
    );

    expect(stdout).toBe("[V] Cookie [ ] Proxy [ ] Upload");
    await expectClosedTransportFailure(command);
  });
});
