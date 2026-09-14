import { describe, expect, it } from "vitest";

import { haStatus } from "../../../src/domains/ha.js";
import { parseHaStatus } from "../../../src/internal/parsers/ha/status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_STATUS_TEXT = [
  "%    [Local Router] Marketing3912",
  "%    IP                    : 192.168.100.1 (FE80::21D:AAFF:FE4B:3E80)",
  "%    Status               : !",
  "%    High Availability    : ! Disable",
].join("\n");

describe("cli.ha.status -- ha status -a|-m <Detail Level>", () => {
  it("builds the documented scoped frame and rejects invalid scope/detail level", () => {
    expect(firstFrame(haStatus.buildFrames({ scope: "localRouter", detailLevel: 2 })).command).toBe(
      "ha status -m 2",
    );
    expect(firstFrame(haStatus.buildFrames({ scope: "allRouters", detailLevel: 0 })).command).toBe(
      "ha status -a 0",
    );

    expect(() =>
      haStatus.buildFrames({ scope: "bogus" as unknown as "allRouters", detailLevel: 0 }),
    ).toThrow(/scope must be one of/);
    expect(() =>
      haStatus.buildFrames({ scope: "localRouter", detailLevel: 3 as unknown as 0 | 1 | 2 }),
    ).toThrow(/detailLevel must be one of/);
  });

  it("parses the documented status text (synthetic sample)", () => {
    expect(parseHaStatus(SAMPLE_STATUS_TEXT)).toEqual({ raw: SAMPLE_STATUS_TEXT });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(haStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      haStatus.buildFrames({ scope: "localRouter", detailLevel: 2 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_STATUS_TEXT);

    expect(haStatus.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_STATUS_TEXT });

    await expectClosedTransportFailure(command);
  });
});
