import { describe, expect, it } from "vitest";

import { ipLanAlias } from "../../../src/domains/ip.js";
import { parseLanAlias } from "../../../src/internal/parsers/ip/lanalias.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.lanalias -- ip lanalias", () => {
  it("builds the documented frames per variant and rejects invalid input", () => {
    expect(
      firstFrame(ipLanAlias.buildFrames({ idx: 1, action: "enable", enabled: true })).command,
    ).toBe("ip lanalias 1 -e 1");
    expect(
      firstFrame(ipLanAlias.buildFrames({ idx: 1, action: "enable", enabled: false })).command,
    ).toBe("ip lanalias 1 -e 0");
    expect(
      firstFrame(ipLanAlias.buildFrames({ idx: 1, action: "setAux", ipv4Address: "192.168.1.56" }))
        .command,
    ).toBe("ip lanalias 1 -a 192.168.1.56");
    expect(
      firstFrame(ipLanAlias.buildFrames({ idx: 2, action: "assignWan", wanNumber: 1 })).command,
    ).toBe("ip lanalias 2 -w 1");
    expect(firstFrame(ipLanAlias.buildFrames({ idx: 3, action: "removeWan" })).command).toBe(
      "ip lanalias 3 -r",
    );

    expect(() => ipLanAlias.buildFrames({ idx: 0, action: "enable", enabled: true })).toThrow(
      /idx/,
    );
    expect(() => ipLanAlias.buildFrames({ idx: 6, action: "enable", enabled: true })).toThrow(
      /idx/,
    );
    expect(() =>
      ipLanAlias.buildFrames({ idx: 1, action: "setAux", ipv4Address: "not-an-ip" }),
    ).toThrow(/ipv4Address/);
    expect(() => ipLanAlias.buildFrames({ idx: 1, action: "assignWan", wanNumber: 6 })).toThrow(
      /wanNumber/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseLanAlias(">\n")).toEqual({ raw: ">" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipLanAlias, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      ipLanAlias.buildFrames({ idx: 1, action: "setAux", ipv4Address: "192.168.1.56" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, ">\n");

    expect(stdout).toBe(">\n");

    expect(ipLanAlias.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
