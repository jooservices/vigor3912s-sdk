import { describe, expect, it } from "vitest";

import { hsportalInfo } from "../../../src/domains/hsportal.js";
import { parseInfo } from "../../../src/internal/parsers/hsportal/info.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.hsportal.info -- hsportal info (read-only query, rawLine 11458)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = hsportalInfo.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("hsportal info");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseInfo(" Enabled database to record information ... [OK]\n")).toEqual({
      raw: "Enabled database to record information ... [OK]",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(hsportalInfo, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(hsportalInfo.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      " Enabled database to record information ... [OK]\n",
    );

    expect(hsportalInfo.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Enabled database to record information ... [OK]",
    });

    await expectClosedTransportFailure(command);
  });

  it("parses an empty raw string when no exchange is present (defensive fallback)", () => {
    expect(hsportalInfo.parse([])).toEqual({ raw: "" });
  });
});
