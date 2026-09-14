import { describe, expect, it } from "vitest";

import { ip6Mngt } from "../../../src/domains/ip6.js";
import { parseMngt } from "../../../src/internal/parsers/ip6/mngt.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_STATUS_TEXT = [
  "% IPv6 Remote Management :",
  "internet access : off,  telnet : off,   http : off,     https : off,    ssh :",
  "off,      ping : off,     enforce_https : off",
  "",
].join("\n");

describe("cli.ip6.mngt -- ip6 mngt (write)", () => {
  it("builds documented frames per variant and rejects out-of-range input", () => {
    expect(firstFrame(ip6Mngt.buildFrames({ action: "list" })).command).toBe("ip6 mngt list");
    expect(
      firstFrame(ip6Mngt.buildFrames({ action: "listAdd", index: 1, objectIndex: 1 })).command,
    ).toBe("ip6 mngt list add 1 1");
    expect(firstFrame(ip6Mngt.buildFrames({ action: "listRemove", index: 2 })).command).toBe(
      "ip6 mngt list remove 2",
    );
    expect(firstFrame(ip6Mngt.buildFrames({ action: "listFlush" })).command).toBe(
      "ip6 mngt list flush",
    );
    expect(firstFrame(ip6Mngt.buildFrames({ action: "status" })).command).toBe("ip6 mngt status");
    expect(
      firstFrame(ip6Mngt.buildFrames({ action: "service", service: "https", enabled: true }))
        .command,
    ).toBe("ip6 mngt https on");
    expect(
      firstFrame(
        ip6Mngt.buildFrames({ action: "service", service: "enforce_https", enabled: false }),
      ).command,
    ).toBe("ip6 mngt enforce_https off");

    expect(() => ip6Mngt.buildFrames({ action: "listAdd", index: 0, objectIndex: 1 })).toThrow(
      /index/,
    );
    expect(() => ip6Mngt.buildFrames({ action: "listAdd", index: 1, objectIndex: 65 })).toThrow(
      /objectIndex/,
    );
    expect(() =>
      ip6Mngt.buildFrames({
        action: "service",
        service: "ftp" as "http",
        enabled: true,
      }),
    ).toThrow(/service/);
  });

  it("parses the documented status text (synthetic sample)", () => {
    expect(parseMngt(SAMPLE_STATUS_TEXT)).toEqual({ raw: SAMPLE_STATUS_TEXT.trim() });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6Mngt, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Mngt.buildFrames({ action: "status" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_STATUS_TEXT);

    expect(ip6Mngt.parse([exchange(stdout)])).toEqual({ raw: SAMPLE_STATUS_TEXT.trim() });

    await expectClosedTransportFailure(command);
  });
});
