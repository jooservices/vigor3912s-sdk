import { describe, expect, it } from "vitest";

import { ip6Aiccu } from "../../../src/domains/ip6.js";
import { parseAiccu } from "../../../src/internal/parsers/ip6/aiccu.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.aiccu", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6Aiccu.buildFrames({ action: "status", wan: 1 })).command).toBe(
      "ip6 aiccu -i 1 -s",
    );
    expect(firstFrame(ip6Aiccu.buildFrames({ action: "remove", wan: 1 })).command).toBe(
      "ip6 aiccu -i 1 -r",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseAiccu(
        "ip6 aiccu -i 1 -s\
",
      ),
    ).toEqual({ raw: "ip6 aiccu -i 1 -s" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6Aiccu, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Aiccu.buildFrames({ action: "status", wan: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "ip6 aiccu -i 1 -s\
",
    );

    expect(ip6Aiccu.parse([exchange(stdout)])).toEqual({ raw: "ip6 aiccu -i 1 -s" });
    expect(command).toBe("ip6 aiccu -i 1 -s");

    await expectClosedTransportFailure(command);
  });
});
