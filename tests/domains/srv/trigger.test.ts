import { describe, expect, it } from "vitest";

import { srvNatTrigger } from "../../../src/domains/srv.js";
import { parseTrigger } from "../../../src/internal/parsers/srv/trigger.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.nat.trigger -- srv nat trigger setdefault|view|<n> -c|-e|-g|-p|-t|-P|-i|-d|-v", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    expect(firstFrame(srvNatTrigger.buildFrames({ action: "setDefault" })).command).toBe(
      "srv nat trigger setdefault",
    );
    expect(firstFrame(srvNatTrigger.buildFrames({ action: "view" })).command).toBe(
      "srv nat trigger view",
    );
    expect(
      firstFrame(srvNatTrigger.buildFrames({ action: "comment", rule: 1, comment: "after_dinner" }))
        .command,
    ).toBe("srv nat trigger 1 -c after_dinner");
    expect(
      firstFrame(srvNatTrigger.buildFrames({ action: "enable", rule: 1, enabled: true })).command,
    ).toBe("srv nat trigger 1 -e 1");
    expect(
      firstFrame(srvNatTrigger.buildFrames({ action: "enable", rule: 1, enabled: false })).command,
    ).toBe("srv nat trigger 1 -e 0");
    expect(
      firstFrame(srvNatTrigger.buildFrames({ action: "sourceIpType", rule: 1, ipType: 0 })).command,
    ).toBe("srv nat trigger 1 -g0");
    expect(
      firstFrame(srvNatTrigger.buildFrames({ action: "protocol", rule: 1, protocol: 1 })).command,
    ).toBe("srv nat trigger 1 -p 1");
    expect(
      firstFrame(srvNatTrigger.buildFrames({ action: "triggerPort", rule: 1, port: 2000 })).command,
    ).toBe("srv nat trigger 1 -t 2000");
    expect(
      firstFrame(srvNatTrigger.buildFrames({ action: "incomingProtocol", rule: 1, protocol: 2 }))
        .command,
    ).toBe("srv nat trigger 1 -P 2");
    expect(
      firstFrame(srvNatTrigger.buildFrames({ action: "incomingPort", rule: 1, port: 3000 }))
        .command,
    ).toBe("srv nat trigger 1 -i 3000");
    expect(firstFrame(srvNatTrigger.buildFrames({ action: "delete", rule: 1 })).command).toBe(
      "srv nat trigger 1 -d",
    );
    expect(firstFrame(srvNatTrigger.buildFrames({ action: "viewRule", rule: 1 })).command).toBe(
      "srv nat trigger 1 -v",
    );

    expect(() => srvNatTrigger.buildFrames({ action: "delete", rule: 0 })).toThrow(/rule/);
    expect(() =>
      srvNatTrigger.buildFrames({
        action: "protocol",
        rule: 1,
        protocol: 4 as unknown as 1 | 2 | 3,
      }),
    ).toThrow(/protocol/);
  });

  it("parses the documented rule-view text (synthetic sample)", () => {
    expect(parseTrigger("Status:Enable\n")).toEqual({ raw: "Status:Enable" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvNatTrigger, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvNatTrigger.buildFrames({ action: "viewRule", rule: 1 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Status:Enable\n");

    expect(stdout).toBe("Status:Enable\n");
    expect(srvNatTrigger.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
