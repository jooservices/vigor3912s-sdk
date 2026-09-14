import { describe, expect, it } from "vitest";

import { haShow } from "../../../src/domains/ha.js";
import { parseHaShow } from "../../../src/internal/parsers/ha/show.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_GENERAL_SETUP_TEXT = [
  "%   High Availability     : Disable",
  "%   Redundancy Method     : Active-Standby",
  "%   Group ID              : 1",
  "%   Priority ID           : 10",
  "%   Update DDNS           : Disable",
  "%   Protocol              : IPv4",
  "%   Management Interface  : LAN1",
  "%   Authentication Key    : draytek",
  "%   Syslog                : OFF",
].join("\n");

describe("cli.ha.show -- ha show -c / ha show -g", () => {
  it("builds the documented per-section frame and rejects an unknown section", () => {
    expect(firstFrame(haShow.buildFrames({ section: "generalSetup" })).command).toBe("ha show -g");
    expect(firstFrame(haShow.buildFrames({ section: "configSync" })).command).toBe("ha show -c");

    expect(() => haShow.buildFrames({ section: "bogus" as unknown as "configSync" })).toThrow(
      /section must be one of/,
    );
  });

  it("parses the documented general-setup settings dump (synthetic sample)", () => {
    expect(parseHaShow(SAMPLE_GENERAL_SETUP_TEXT)).toEqual({ raw: SAMPLE_GENERAL_SETUP_TEXT });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(haShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(haShow.buildFrames({ section: "generalSetup" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_GENERAL_SETUP_TEXT);

    expect(haShow.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_GENERAL_SETUP_TEXT });

    await expectClosedTransportFailure(command);
  });
});
