import { describe, expect, it } from "vitest";

import { ip6Tspc } from "../../../src/domains/ip6.js";
import { parseTspc } from "../../../src/internal/parsers/ip6/tspc.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.tspc", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6Tspc.buildFrames({ wan: 2 })).command).toBe("ip6 tspc 2");
    expect(() => ip6Tspc.buildFrames({ wan: 0 })).toThrow(/wan/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseTspc(
        "Local Endpoint v4 Address : 111.243.177.223\
Status: Connected\
",
      ),
    ).toEqual({
      raw: "Local Endpoint v4 Address : 111.243.177.223\
Status: Connected",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ip6Tspc, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Tspc.buildFrames({ wan: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Local Endpoint v4 Address : 111.243.177.223\
Status: Connected\
",
    );

    expect(ip6Tspc.parse([exchange(stdout)])).toEqual({
      raw: "Local Endpoint v4 Address : 111.243.177.223\
Status: Connected",
    });
    expect(command).toBe("ip6 tspc 2");

    await expectClosedTransportFailure(command);
  });
});
