import { describe, expect, it } from "vitest";

import { ipDataflowmonitorOff } from "../../../src/domains/ip.js";
import { parseDataflowmonitorOff } from "../../../src/internal/parsers/ip/dataflowmonitor-off.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.dataflowmonitor.off -- ip dataflowmonitor off", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipDataflowmonitorOff.buildFrames()).command).toBe("ip dataflowmonitor off");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDataflowmonitorOff("Data Flow Monitor: Off\n")).toEqual({
      raw: "Data Flow Monitor: Off",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipDataflowmonitorOff, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipDataflowmonitorOff.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Data Flow Monitor: Off\n");

    expect(stdout).toBe("Data Flow Monitor: Off\n");

    expect(ipDataflowmonitorOff.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
