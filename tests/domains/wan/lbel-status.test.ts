import { describe, expect, it } from "vitest";

import { wanLbelStatus } from "../../../src/domains/wan.js";
import { parseLbelStatus } from "../../../src/internal/parsers/wan/lbel-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "list[1] status:enable\n";

describe("cli.wan.lbel.status", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(wanLbelStatus.buildFrames({ index: 1 }));

    expect(frame.command).toBe("wan lbel status 1");
    expect(() => wanLbelStatus.buildFrames({ index: 0 })).toThrow(/index/);
    expect(() => wanLbelStatus.buildFrames({ index: 33 })).toThrow(/index/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseLbelStatus(SAMPLE_TEXT)).toEqual({
      raw: "list[1] status:enable",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(wanLbelStatus, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanLbelStatus.buildFrames({ index: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "list[1] status:enable");

    expect(stdout).toBe("list[1] status:enable");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanLbelStatus.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(
      parseLbelStatus(SAMPLE_TEXT),
    );
  });
});
