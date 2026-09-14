import { describe, expect, it } from "vitest";

import { hsportalSetup } from "../../../src/domains/hsportal.js";
import { parseSetup } from "../../../src/internal/parsers/hsportal/setup.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.hsportal.setup -- hsportal setup -p <profile> ... (rawLine 11395)", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    const resetFrame = firstFrame(hsportalSetup.buildFrames({ profile: 1, action: "reset" }));

    expect(resetFrame.command).toBe("hsportal setup -p 1 -c");

    const enableFrame = firstFrame(hsportalSetup.buildFrames({ profile: 2, action: "enable" }));

    expect(enableFrame.command).toBe("hsportal setup -p 2 -e");

    const disableFrame = firstFrame(hsportalSetup.buildFrames({ profile: 2, action: "disable" }));

    expect(disableFrame.command).toBe("hsportal setup -p 2 -d");

    const landingPageFrame = firstFrame(
      hsportalSetup.buildFrames({ profile: 1, action: "landingPageMode", mode: 0 }),
    );

    expect(landingPageFrame.command).toBe("hsportal setup -p 1 -r 0");

    const googleFrame = firstFrame(
      hsportalSetup.buildFrames({
        profile: 2,
        action: "google",
        enabled: true,
        appKey: "app_key_google",
      }),
    );

    expect(googleFrame.command).toBe("hsportal setup -p 2 -g 1 -k app_key_google");

    const googleDisabledFrame = firstFrame(
      hsportalSetup.buildFrames({
        profile: 2,
        action: "google",
        enabled: false,
        appKey: "app_key_google",
      }),
    );

    expect(googleDisabledFrame.command).toBe("hsportal setup -p 2 -g 0 -k app_key_google");

    const facebookFrame = firstFrame(
      hsportalSetup.buildFrames({
        profile: 1,
        action: "facebook",
        enabled: false,
        appId: "this_is_app_id",
      }),
    );

    expect(facebookFrame.command).toBe("hsportal setup -p 1 -f 0 -i this_is_app_id");

    const facebookEnabledFrame = firstFrame(
      hsportalSetup.buildFrames({
        profile: 1,
        action: "facebook",
        enabled: true,
        appId: "this_is_app_id",
      }),
    );

    expect(facebookEnabledFrame.command).toBe("hsportal setup -p 1 -f 1 -i this_is_app_id");

    expect(() => hsportalSetup.buildFrames({ profile: 0, action: "reset" })).toThrow(/profile/);
    expect(() => hsportalSetup.buildFrames({ profile: 5, action: "reset" })).toThrow(/profile/);
    expect(() => hsportalSetup.buildFrames({ profile: 1.5, action: "reset" })).toThrow(
      /profile must be an integer/,
    );
    expect(() =>
      hsportalSetup.buildFrames({ profile: 1, action: "google", enabled: true, appKey: "" }),
    ).toThrow(/appKey/);
    expect(() =>
      hsportalSetup.buildFrames({ profile: 1, action: "facebook", enabled: true, appId: "" }),
    ).toThrow(/appId/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSetup("Reset profile 1 ... [OK]\n")).toEqual({
      raw: "Reset profile 1 ... [OK]",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(hsportalSetup, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(hsportalSetup.buildFrames({ profile: 1, action: "reset" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Reset profile 1 ... [OK]\n");

    expect(hsportalSetup.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Reset profile 1 ... [OK]",
    });

    await expectClosedTransportFailure(command);
  });
});
