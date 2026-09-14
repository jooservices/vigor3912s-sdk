import { describe, expect, it } from "vitest";

import { radiusClientAdd } from "../../../src/domains/radius.js";
import { parseClientAdd } from "../../../src/internal/parsers/radius/client-add.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.radius.client.add -- radius client add (write)", () => {
  it("builds the documented client-add frame and rejects invalid input", () => {
    expect(
      firstFrame(
        radiusClientAdd.buildFrames({
          index: 1,
          ipv4Address: "192.168.1.1",
          ipv4Mask: "255.255.255.0",
          secret: "123",
        }),
      ).command,
    ).toBe("radius client add 1 -i 192.168.1.1 -m 255.255.255.0 -s 123");

    expect(() => radiusClientAdd.buildFrames({ index: 0, ipv4Address: "1.2.3.4" })).toThrow(
      /index/,
    );
    expect(() => radiusClientAdd.buildFrames({ index: 1 })).toThrow(/at least one/i);
    expect(() => radiusClientAdd.buildFrames({ index: 1, ipv4Address: "has space" })).toThrow(
      /ipv4Address/,
    );
  });

  it("builds the documented IPv6 client-add frame and rejects invalid IPv6 options", () => {
    expect(
      firstFrame(
        radiusClientAdd.buildFrames({
          index: 2,
          ipv6Prefix: "2001:db8::",
          ipv6PrefixLength: 64,
        }),
      ).command,
    ).toBe("radius client add 2 -p 2001:db8:: -l 64");

    expect(() => radiusClientAdd.buildFrames({ index: 2, ipv6Prefix: "has space" })).toThrow(
      /ipv6Prefix/,
    );
    expect(() => radiusClientAdd.buildFrames({ index: 2, ipv6PrefixLength: 129 })).toThrow(
      /ipv6PrefixLength/,
    );
  });

  it("rejects a malformed secret without echoing the value into Error.message", () => {
    const secretValue = "synthetic-only-canary-Sk7Rm";

    let caught: unknown;
    try {
      radiusClientAdd.buildFrames({
        index: 1,
        ipv4Address: "192.168.1.1",
        secret: `${secretValue} has space`,
      });
      throw new Error("expected buildFrames to throw for a malformed secret");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toMatch(/secret/);
    expect((caught as Error).message).not.toContain(secretValue);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseClientAdd(" Set radius server client OK\n")).toEqual({
      raw: "Set radius server client OK",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(radiusClientAdd, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      radiusClientAdd.buildFrames({
        index: 1,
        ipv4Address: "192.168.1.1",
        ipv4Mask: "255.255.255.0",
        secret: "123",
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      " Set radius server client OK\n",
    );

    expect(radiusClientAdd.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Set radius server client OK",
    });

    await expectClosedTransportFailure(command);
  });
});
