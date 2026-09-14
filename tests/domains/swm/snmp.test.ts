import { describe, expect, it } from "vitest";

import { swmSnmp } from "../../../src/domains/swm.js";
import { parseSwmSnmp } from "../../../src/internal/parsers/swm/snmp.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const MAC = "001DAA0CCD08";

describe("cli.swm.snmp -- swm snmp sys/iftbl/poe/trpcom", () => {
  it("builds the documented frame for every variant and rejects invalid input", () => {
    expect(firstFrame(swmSnmp.buildFrames({ action: "sys", mac: MAC })).command).toBe(
      `swm snmp sys ${MAC}`,
    );
    expect(firstFrame(swmSnmp.buildFrames({ action: "iftbl", mac: MAC, portNum: 3 })).command).toBe(
      `swm snmp iftbl ${MAC} 3`,
    );
    expect(firstFrame(swmSnmp.buildFrames({ action: "poe", mac: MAC })).command).toBe(
      `swm snmp poe ${MAC}`,
    );
    expect(firstFrame(swmSnmp.buildFrames({ action: "trpcomShow", mac: MAC })).command).toBe(
      `swm snmp trpcom show ${MAC}`,
    );
    expect(
      firstFrame(swmSnmp.buildFrames({ action: "trpcomSet", mac: MAC, name: "public" })).command,
    ).toBe(`swm snmp trpcom set ${MAC} public`);

    expect(() => swmSnmp.buildFrames({ action: "iftbl", mac: MAC, portNum: 29 })).toThrow(
      /portNum/,
    );
    expect(() => swmSnmp.buildFrames({ action: "sys", mac: "bad" })).toThrow(/mac/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmSnmp("Trap Community:public\n")).toEqual({ raw: "Trap Community:public" });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmSnmp.parse([exchange("Trap Community:public\n")])).toEqual(
      parseSwmSnmp("Trap Community:public\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmSnmp, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmSnmp.buildFrames({ action: "sys", mac: MAC })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
