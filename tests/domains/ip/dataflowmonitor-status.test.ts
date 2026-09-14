import { describe, expect, it } from "vitest";

import { ipDataflowmonitorStatus } from "../../../src/domains/ip.js";
import { parseDataflowmonitorStatus } from "../../../src/internal/parsers/ip/dataflowmonitor-status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.dataflowmonitor.status -- ip dataflowmonitor status", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipDataflowmonitorStatus.buildFrames()).command).toBe(
      "ip dataflowmonitor status",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDataflowmonitorStatus("  Data Flow Monitor: On\n")).toEqual({
      raw: "Data Flow Monitor: On",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipDataflowmonitorStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipDataflowmonitorStatus.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "  Data Flow Monitor: On\n");

    expect(stdout).toBe("  Data Flow Monitor: On\n");

    expect(ipDataflowmonitorStatus.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
