import { describe, expect, it } from "vitest";

import { radiusExternal } from "../../../src/domains/radius.js";
import { parseExternal } from "../../../src/internal/parsers/radius/external.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.radius.external -- radius external configure flags (write)", () => {
  it("builds the documented flagged frame and rejects empty/unknown-flag input", () => {
    expect(
      firstFrame(radiusExternal.buildFrames({ args: ["-i", "1", "0", "192.168.1.1"] })).command,
    ).toBe("radius external -i 1 0 192.168.1.1");

    expect(() => radiusExternal.buildFrames({ args: [] })).toThrow(/at least one argument/);
    expect(() => radiusExternal.buildFrames({ args: ["-V"] })).toThrow(
      /is not one of the documented flags/,
    );
    expect(() => radiusExternal.buildFrames({ args: ["-v"] })).toThrow(
      /is not one of the documented flags/,
    );
    expect(() => radiusExternal.buildFrames({ args: ["-i", "", "0"] })).toThrow(
      /must not be empty or whitespace-only/,
    );
    expect(() => radiusExternal.buildFrames({ args: ["-i", "has space", "0"] })).toThrow(
      /must not contain whitespace/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseExternal(
        ' This setting will take effect after rebooting.\n Please use "sys reboot" command to reboot the router.\n',
      ),
    ).toEqual({
      raw: 'This setting will take effect after rebooting.\n Please use "sys reboot" command to reboot the router.',
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(radiusExternal, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const sample =
      ' This setting will take effect after rebooting.\n Please use "sys reboot" command to reboot the router.\n';
    const command = firstFrame(
      radiusExternal.buildFrames({ args: ["-i", "1", "0", "192.168.1.1"] }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, sample);

    expect(radiusExternal.parse([{ stdout, stderr: "" }])).toEqual({
      raw: 'This setting will take effect after rebooting.\n Please use "sys reboot" command to reboot the router.',
    });

    await expectClosedTransportFailure(command);
  });
});
