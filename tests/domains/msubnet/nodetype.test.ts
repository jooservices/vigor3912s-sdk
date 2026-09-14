import { describe, expect, it } from "vitest";

import { msubnetNodetype } from "../../../src/domains/msubnet.js";
import { parseNodetype } from "../../../src/internal/parsers/msubnet/nodetype.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.nodetype -- msubnet nodetype", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetNodetype.buildFrames({ lanIndex: 2, nodeType: 1 }));

    expect(frame.command).toBe("msubnet nodetype 2 1");

    expect(() => msubnetNodetype.buildFrames({ lanIndex: 2, nodeType: 3 as unknown as 1 })).toThrow(
      /nodeType/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseNodetype("% Set Dhcp Node Type done !!!\n")).toEqual({
      raw: "% Set Dhcp Node Type done !!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetNodetype, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(msubnetNodetype.buildFrames({ lanIndex: 2, nodeType: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Set Dhcp Node Type done !!!\n",
    );

    expect(stdout).toBe("% Set Dhcp Node Type done !!!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% Set Dhcp Node Type done !!!\n";

    expect(msubnetNodetype.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseNodetype(sampleText),
    );
  });
});
