import { describe, expect, it } from "vitest";

import { dosView } from "../../../src/domains/dos.js";
import { parseView } from "../../../src/internal/parsers/dos/view.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% DoS Defense system is Activated\n";

describe("cli.dos.v -- dos -V (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = dosView.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("dos -V");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseView(SAMPLE_TEXT)).toEqual({ raw: "% DoS Defense system is Activated" });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(dosView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(dosView.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(dosView.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% DoS Defense system is Activated",
    });

    await expectClosedTransportFailure(command);
  });

  it("parses an empty raw string when no exchange is present (defensive fallback)", () => {
    expect(dosView.parse([])).toEqual({ raw: "" });
  });
});
