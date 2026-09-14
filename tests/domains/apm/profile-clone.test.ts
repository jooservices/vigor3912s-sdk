import { describe, expect, it } from "vitest";

import { apmProfileClone } from "../../../src/domains/apm.js";
import { parseProfileClone } from "../../../src/internal/parsers/apm/profile-clone.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.apm.profile.clone -- apm profile clone <from> <to> <name>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      apmProfileClone.buildFrames({ fromIndex: 1, toIndex: 2, newName: "forcarrie" }),
    );

    expect(frame.command).toBe("apm profile clone 1 2 forcarrie");
    expect(() => apmProfileClone.buildFrames({ fromIndex: 0, toIndex: 2, newName: "x" })).toThrow(
      /fromIndex/,
    );
    expect(() => apmProfileClone.buildFrames({ fromIndex: 1, toIndex: 2, newName: "  " })).toThrow(
      /newName/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseProfileClone("(Done)\n")).toEqual({ raw: "(Done)" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(apmProfileClone, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      apmProfileClone.buildFrames({ fromIndex: 1, toIndex: 2, newName: "forcarrie" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "(Done)");

    expect(stdout).toBe("(Done)");
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseProfileClone", () => {
    expect(apmProfileClone.parse([exchange("(Done)")])).toEqual(parseProfileClone("(Done)"));
  });
});
