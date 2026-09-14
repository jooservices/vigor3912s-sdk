import { describe, expect, it } from "vitest";

import { ipNmask } from "../../../src/domains/ip.js";
import { parseNmask } from "../../../src/internal/parsers/ip/nmask.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.nmask -- ip nmask", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(ipNmask.buildFrames({ netmask: "255.255.0.0" }));

    expect(frame.command).toBe("ip nmask 255.255.0.0");

    expect(() => ipNmask.buildFrames({ netmask: "not-a-mask" })).toThrow(/netmask/);
    expect(() => ipNmask.buildFrames({ netmask: "256.0.0.0" })).toThrow(/netmask/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseNmask("% Set IP netmask OK !!!\n")).toEqual({ raw: "% Set IP netmask OK !!!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipNmask, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipNmask.buildFrames({ netmask: "255.255.0.0" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Set IP netmask OK !!!\n");

    expect(stdout).toBe("% Set IP netmask OK !!!\n");

    expect(ipNmask.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
