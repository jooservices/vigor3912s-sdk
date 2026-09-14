import { describe, expect, it } from "vitest";

import { srvNatRstTimeout } from "../../../src/domains/srv.js";
import { parseRsttimeout } from "../../../src/internal/parsers/srv/rsttimeout.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.nat.rsttimeout", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvNatRstTimeout.buildFrames({ value: 2 })).command).toBe(
      "srv nat RSTTimeout 2",
    );
    expect(() => srvNatRstTimeout.buildFrames({ value: 11 })).toThrow(/value/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseRsttimeout(
        "Set timeout 2 unit\
",
      ),
    ).toEqual({ raw: "Set timeout 2 unit" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvNatRstTimeout, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvNatRstTimeout.buildFrames({ value: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Set timeout 2 unit\
",
    );

    expect(stdout).toBe(
      "Set timeout 2 unit\
",
    );
    expect(srvNatRstTimeout.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
