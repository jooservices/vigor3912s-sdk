import { describe, expect, it } from "vitest";

import { swmSearch } from "../../../src/domains/swm.js";
import { parseSwmSearch } from "../../../src/internal/parsers/swm/search.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.search -- swm search mac/ip/description", () => {
  it("builds the documented frame for every variant and rejects invalid input", () => {
    expect(firstFrame(swmSearch.buildFrames({ action: "mac", mac: "001DAA0CCD08" })).command).toBe(
      "swm search mac 001DAA0CCD08",
    );

    expect(firstFrame(swmSearch.buildFrames({ action: "ip", ip: "192.168.1.10" })).command).toBe(
      "swm search ip 192.168.1.10",
    );

    expect(
      firstFrame(swmSearch.buildFrames({ action: "description", query: "G2280" })).command,
    ).toBe("swm search description G2280");

    expect(() => swmSearch.buildFrames({ action: "ip", ip: "999.1.1.1" })).toThrow(/ip/);
    expect(() => swmSearch.buildFrames({ action: "description", query: "" })).toThrow(/query/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmSearch("Switch  192.168.1.10\n")).toEqual({ raw: "Switch  192.168.1.10" });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmSearch.parse([exchange("Switch  192.168.1.10\n")])).toEqual(
      parseSwmSearch("Switch  192.168.1.10\n"),
    );
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(swmSearch, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      swmSearch.buildFrames({ action: "mac", mac: "001DAA0CCD08" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "OK");

    expect(stdout).toBe("OK");
    await expectClosedTransportFailure(command);
  });
});
