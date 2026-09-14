import { describe, expect, it } from "vitest";

import { hsportalLevel } from "../../../src/domains/hsportal.js";
import { parseLevel } from "../../../src/internal/parsers/hsportal/level.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.hsportal.level -- hsportal level (read-only query, rawLine 11494)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = hsportalLevel.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("hsportal level");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseLevel(" Profile 1 quota policy ... [OK]\n")).toEqual({
      raw: "Profile 1 quota policy ... [OK]",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(hsportalLevel, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(hsportalLevel.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      " Profile 1 quota policy ... [OK]\n",
    );

    expect(hsportalLevel.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Profile 1 quota policy ... [OK]",
    });

    await expectClosedTransportFailure(command);
  });
});
