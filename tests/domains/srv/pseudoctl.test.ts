import { describe, expect, it } from "vitest";

import { srvNatPseudoctl } from "../../../src/domains/srv.js";
import { parsePseudoctl } from "../../../src/internal/parsers/srv/pseudoctl.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.nat.pseudoctl", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvNatPseudoctl.buildFrames({ action: "function", mode: 2 })).command).toBe(
      "srv nat pseudoctl function 2",
    );
    expect(
      firstFrame(srvNatPseudoctl.buildFrames({ action: "session", threshold: 100 })).command,
    ).toBe("srv nat pseudoctl session 100");
    expect(() => srvNatPseudoctl.buildFrames({ action: "function", mode: 4 as 0 })).toThrow(/mode/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parsePseudoctl(
        " pesudo port: get hash pseudo port + subnet.\
",
      ),
    ).toEqual({ raw: "pesudo port: get hash pseudo port + subnet." });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvNatPseudoctl, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      srvNatPseudoctl.buildFrames({ action: "function", mode: 2 }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      " pesudo port: get hash pseudo port + subnet.\
",
    );

    expect(stdout).toBe(
      " pesudo port: get hash pseudo port + subnet.\
",
    );
    expect(srvNatPseudoctl.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
