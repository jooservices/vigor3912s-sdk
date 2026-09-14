import { describe, expect, it } from "vitest";

import { tacacsplusSet } from "../../../src/domains/tacacsplus.js";
import { parseSet } from "../../../src/internal/parsers/tacacsplus/set.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.tacacsplus.set -- tacacsplus set (write)", () => {
  it("builds the documented frame for each flag variant and rejects invalid input", () => {
    expect(firstFrame(tacacsplusSet.buildFrames({ action: "enable", enabled: true })).command).toBe(
      "tacacsplus set -e 1",
    );
    expect(
      firstFrame(tacacsplusSet.buildFrames({ action: "enable", enabled: false })).command,
    ).toBe("tacacsplus set -e 0");

    expect(
      firstFrame(
        tacacsplusSet.buildFrames({
          action: "serverIp",
          serverIndex: 1,
          ipAddress: "192.168.1.59",
        }),
      ).command,
    ).toBe('tacacsplus set -i "1 192.168.1.59"');

    expect(
      firstFrame(tacacsplusSet.buildFrames({ action: "serverPort", serverIndex: 0, port: 49 }))
        .command,
    ).toBe('tacacsplus set -p "0 49"');

    expect(
      firstFrame(
        tacacsplusSet.buildFrames({ action: "sharedSecret", serverIndex: 0, secret: "s3cr3t" }),
      ).command,
    ).toBe('tacacsplus set -s "0 s3cr3t"');

    expect(firstFrame(tacacsplusSet.buildFrames({ action: "clear" })).command).toBe(
      "tacacsplus set -C yes",
    );

    expect(() =>
      tacacsplusSet.buildFrames({
        action: "serverIp",
        serverIndex: 2 as 0 | 1,
        ipAddress: "1.1.1.1",
      }),
    ).toThrow(/serverIndex/);
    expect(() =>
      tacacsplusSet.buildFrames({ action: "serverIp", serverIndex: 0, ipAddress: "not-an-ip" }),
    ).toThrow(/ipAddress/);
    expect(() =>
      tacacsplusSet.buildFrames({ action: "serverPort", serverIndex: 0, port: 0 }),
    ).toThrow(/port/);
    expect(() =>
      tacacsplusSet.buildFrames({ action: "serverPort", serverIndex: 0, port: 65536 }),
    ).toThrow(/port/);
    expect(() =>
      tacacsplusSet.buildFrames({ action: "sharedSecret", serverIndex: 0, secret: "" }),
    ).toThrow(/secret/);
    expect(() =>
      tacacsplusSet.buildFrames({ action: "sharedSecret", serverIndex: 0, secret: 'has"quote' }),
    ).toThrow(/secret/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSet("TACACS+ enabled!\n This setting will take effect after rebooting.\n")).toEqual(
      { raw: "TACACS+ enabled!\n This setting will take effect after rebooting." },
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(tacacsplusSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      tacacsplusSet.buildFrames({ action: "enable", enabled: true }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "TACACS+ enabled!\n");

    expect(tacacsplusSet.parse([{ stdout, stderr: "" }])).toEqual({ raw: "TACACS+ enabled!" });

    await expectClosedTransportFailure(command);
  });
});
