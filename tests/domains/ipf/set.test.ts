import { describe, expect, it } from "vitest";

import { ipfSet } from "../../../src/domains/ipf.js";
import { parseSet } from "../../../src/internal/parsers/ipf/set.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ipf.set -- ipf set <Options> (write)", () => {
  it("builds the documented frames for each canonical sub-form and rejects invalid input", () => {
    expect(firstFrame(ipfSet.buildFrames({ action: "callFilterSet", setNo: 3 })).command).toBe(
      "ipf set -c 3",
    );
    expect(firstFrame(ipfSet.buildFrames({ action: "dataFilterSet", setNo: 0 })).command).toBe(
      "ipf set -d 0",
    );
    expect(
      firstFrame(ipfSet.buildFrames({ action: "defaultAction", pass: true, logToSyslog: true }))
        .command,
    ).toBe("ipf set -p 0 1");
    expect(
      firstFrame(
        ipfSet.buildFrames({ action: "acceptRoutingFromWan", family: "v4", enabled: true }),
      ).command,
    ).toBe("ipf set -R v4 0");
    expect(
      firstFrame(ipfSet.buildFrames({ action: "strictSecurityFirewall", enabled: true })).command,
    ).toBe("ipf set -L 1");
    expect(firstFrame(ipfSet.buildFrames({ action: "codePage", page: 20 })).command).toBe(
      "ipf set -C 20",
    );

    expect(
      firstFrame(ipfSet.buildFrames({ action: "defaultAction", pass: false, logToSyslog: false }))
        .command,
    ).toBe("ipf set -p 1 0");
    expect(
      firstFrame(
        ipfSet.buildFrames({ action: "acceptRoutingFromWan", family: "v6", enabled: false }),
      ).command,
    ).toBe("ipf set -R v6 1");
    expect(
      firstFrame(ipfSet.buildFrames({ action: "strictSecurityFirewall", enabled: false })).command,
    ).toBe("ipf set -L 0");

    expect(() => ipfSet.buildFrames({ action: "callFilterSet", setNo: 13 })).toThrow(/setNo/);
    expect(() => ipfSet.buildFrames({ action: "callFilterSet", setNo: 1.5 })).toThrow(
      /setNo must be an integer/,
    );
    expect(() => ipfSet.buildFrames({ action: "codePage", page: 21 })).toThrow(/page/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSet("> ipf set -c 3\n")).toEqual({ raw: "> ipf set -c 3" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipfSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipfSet.buildFrames({ action: "callFilterSet", setNo: 3 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "> ipf set -c 3");

    expect(ipfSet.parse([{ stdout, stderr: "" }])).toEqual({ raw: "> ipf set -c 3" });

    await expectClosedTransportFailure(command);
  });
});
