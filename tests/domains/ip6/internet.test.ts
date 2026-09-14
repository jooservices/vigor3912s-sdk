import { describe, expect, it } from "vitest";

import { ip6Internet } from "../../../src/domains/ip6.js";
import { parseInternet } from "../../../src/internal/parsers/ip6/internet.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.internet", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(
      firstFrame(
        ip6Internet.buildFrames({
          action: "set",
          wan: 2,
          mode: 2,
          username: "EXAMPLE_USER",
          password: "EXAMPLE_PASS",
          server: "amsterdam.freenet6.net",
        }),
      ).command,
    ).toBe(
      "ip6 internet -W 2 -M 2 -u EXAMPLE_USER -p EXAMPLE_PASS -s amsterdam.freenet6.net",
    );
    expect(firstFrame(ip6Internet.buildFrames({ action: "view" })).command).toBe("ip6 internet -V");
    expect(firstFrame(ip6Internet.buildFrames({ action: "dial" })).command).toBe("ip6 internet -k");
    expect(firstFrame(ip6Internet.buildFrames({ action: "drop" })).command).toBe("ip6 internet -j");
    expect(firstFrame(ip6Internet.buildFrames({ action: "set", wan: 1, mode: 0 })).command).toBe(
      "ip6 internet -W 1 -M 0",
    );
    expect(() => ip6Internet.buildFrames({ action: "set", wan: 11, mode: 2 })).toThrow(/wan/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseInternet(
        " This setting will take effect after rebooting.\
",
      ),
    ).toEqual({ raw: "This setting will take effect after rebooting." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6Internet, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Internet.buildFrames({ action: "view" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      " This setting will take effect after rebooting.\
",
    );

    expect(ip6Internet.parse([exchange(stdout)])).toEqual({
      raw: "This setting will take effect after rebooting.",
    });
    expect(command).toBe("ip6 internet -V");

    await expectClosedTransportFailure(command);
  });
});
