import { describe, expect, it } from "vitest";

import { ipDataflowmonitorOn } from "../../../src/domains/ip.js";
import { parseDataflowmonitorOn } from "../../../src/internal/parsers/ip/dataflowmonitor-on.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.dataflowmonitor.on -- ip dataflowmonitor on", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipDataflowmonitorOn.buildFrames()).command).toBe("ip dataflowmonitor on");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDataflowmonitorOn("Data Flow Monitor: On\n")).toEqual({
      raw: "Data Flow Monitor: On",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipDataflowmonitorOn, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipDataflowmonitorOn.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Data Flow Monitor: On\n");

    expect(stdout).toBe("Data Flow Monitor: On\n");

    expect(ipDataflowmonitorOn.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
