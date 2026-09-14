import { describe, expect, it } from "vitest";

import { upnpWan } from "../../../src/domains/upnp.js";
import { parseWan } from "../../../src/internal/parsers/upnp/wan.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "use wan1 now.\n";

describe("cli.upnp.wan", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(upnpWan.buildFrames({ wanIndex: 1 }));

    expect(frame.command).toBe("upnp wan 1");
    expect(() => upnpWan.buildFrames({ wanIndex: -1 })).toThrow(/wanIndex/);
    expect(() => upnpWan.buildFrames({ wanIndex: 13 })).toThrow(/wanIndex/);
  });

  it("rejects a non-integer wanIndex", () => {
    expect(() => upnpWan.buildFrames({ wanIndex: 1.5 })).toThrow(/wanIndex must be an integer/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseWan(SAMPLE_TEXT)).toEqual({
      raw: "use wan1 now.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(upnpWan, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(upnpWan.buildFrames({ wanIndex: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(upnpWan.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "use wan1 now.",
    });

    await expectClosedTransportFailure(command);
  });
});
