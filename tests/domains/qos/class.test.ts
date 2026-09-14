import { describe, expect, it } from "vitest";

import { qosClass } from "../../../src/domains/qos.js";
import { parseQosClass } from "../../../src/internal/parsers/qos/class.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.qos.class -- qos class", () => {
  it("builds the documented frames and rejects invalid input", () => {
    const addFrame = firstFrame(
      qosClass.buildFrames({
        classIndex: 2,
        action: "add",
        name: "draytek",
        ruleEnabled: true,
        localAddress: "192.168.1.50:192.168.1.80",
      }),
    );

    expect(addFrame.command).toBe("qos class -c 2 -n draytek -a -m 1 -l 192.168.1.50:192.168.1.80");

    const editFrame = firstFrame(
      qosClass.buildFrames({ classIndex: 2, action: "edit", ruleIndex: 1 }),
    );
    expect(editFrame.command).toBe("qos class -c 2 -e 1");

    const editDisabledFrame = firstFrame(
      qosClass.buildFrames({ classIndex: 2, action: "edit", ruleIndex: 1, ruleEnabled: false }),
    );
    expect(editDisabledFrame.command).toBe("qos class -c 2 -e 1 -m 0");

    const deleteFrame = firstFrame(
      qosClass.buildFrames({ classIndex: 3, action: "delete", ruleIndex: 4 }),
    );
    expect(deleteFrame.command).toBe("qos class -c 3 -d 4");

    expect(() => qosClass.buildFrames({ classIndex: 0, action: "add" } as never)).toThrow(
      /classIndex/,
    );
    expect(() => qosClass.buildFrames({ classIndex: 4, action: "add" } as never)).toThrow(
      /classIndex/,
    );
    expect(() => qosClass.buildFrames({ classIndex: 1, action: "edit", ruleIndex: 0 })).toThrow(
      /ruleIndex/,
    );
    expect(() => qosClass.buildFrames({ classIndex: 1, action: "delete", ruleIndex: -1 })).toThrow(
      /ruleIndex/,
    );
    expect(() => qosClass.buildFrames({ classIndex: 1, action: "add", name: "has space" })).toThrow(
      /name/,
    );
    expect(() =>
      qosClass.buildFrames({ classIndex: 1, action: "add", localAddress: "not-an-ip" }),
    ).toThrow(/localAddress/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    const sample = [
      " Following setting will set in the class2",
      " class 2 name set to draytek",
      " Add a rule in class2",
      " Class2 the 1 rule enabled",
      " Set local address type to Range, 192.168.1.50:192.168.1.80",
    ].join("\n");

    expect(parseQosClass(sample)).toEqual({ raw: sample.trim() });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(qosClass, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(qosClass.buildFrames({ classIndex: 2, action: "add" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Add a rule in class2");

    expect(qosClass.parse([{ stdout, stderr: "" }])).toEqual({ raw: "Add a rule in class2" });

    await expectClosedTransportFailure(command);
  });
});
