import { describe, expect, it } from "vitest";

import { csmAppeProf } from "../../../src/domains/csm.js";
import { parseAppeProf } from "../../../src/internal/parsers/csm/appe-prof.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_TEXT = "The name of APPE Profile 1 was setted.\n";

describe("cli.csm.appe.prof", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      csmAppeProf.buildFrames({ index: 1, action: "setName", name: "games" }),
    );

    expect(frame.command).toBe("csm appe prof -i 1 -n games");
    expect(firstFrame(csmAppeProf.buildFrames({ index: 1, action: "view" })).command).toBe(
      "csm appe prof -i 1 -v",
    );
    expect(firstFrame(csmAppeProf.buildFrames({ index: 1, action: "setdefault" })).command).toBe(
      "csm appe prof -i 1 setdefault",
    );

    expect(() => csmAppeProf.buildFrames({ index: 0, action: "setName", name: "games" })).toThrow(
      /index/,
    );
    expect(() =>
      csmAppeProf.buildFrames({ index: 1, action: "setName", name: "thisnameistoolong" }),
    ).toThrow(/name/);
    expect(() => csmAppeProf.buildFrames({ index: 1, action: "setName", name: "  " })).toThrow(
      /single non-empty token/,
    );
    expect(() =>
      csmAppeProf.buildFrames({ index: 1, action: "setName", name: "has space" }),
    ).toThrow(/single non-empty token/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseAppeProf(SAMPLE_TEXT)).toEqual({
      raw: "The name of APPE Profile 1 was setted.",
    });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(csmAppeProf.parse([exchange(SAMPLE_TEXT)])).toEqual(parseAppeProf(SAMPLE_TEXT));
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(csmAppeProf, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      csmAppeProf.buildFrames({ index: 1, action: "setName", name: "games" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "The name of APPE Profile 1 was setted.",
    );

    expect(stdout).toBe("The name of APPE Profile 1 was setted.");
    await expectClosedTransportFailure(command);
  });
});
