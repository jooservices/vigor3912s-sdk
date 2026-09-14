import { describe, expect, it } from "vitest";

import { csmAppeShow } from "../../../src/domains/csm.js";
import { parseAppeShow } from "../../../src/internal/parsers/csm/appe-show.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_SHOW_TEXT = [
  "           Type     Index                    Name         Version",
  "----------------------------------------------------------------------------------",
  "       Protocol        44                     BGP                4",
  "       Protocol        45                     DNS",
  "       Protocol        50            IBM Informix",
  "       Protocol        53      IMAP/IMAP STARTTLS      4.1",
  "------------------------------------------------------------------",
  "Total 89 APPs",
  ">",
].join("\n");

describe("cli.csm.appe.show -- csm appe show [-a|-i|-p|-t|-m] (read)", () => {
  it("builds the documented frames incl. no-flag default and rejects invalid input", () => {
    expect(firstFrame(csmAppeShow.buildFrames({})).command).toBe("csm appe show");
    expect(firstFrame(csmAppeShow.buildFrames({ group: "all" })).command).toBe("csm appe show -a");
    expect(firstFrame(csmAppeShow.buildFrames({ group: "protocol" })).command).toBe(
      "csm appe show -t",
    );

    expect(() => csmAppeShow.buildFrames({ group: "bogus" as never })).toThrow(/group/);
  });

  it("parses the documented table (synthetic sample)", () => {
    expect(parseAppeShow(SAMPLE_SHOW_TEXT)).toEqual({
      rows: [
        { type: "Protocol", index: 44, name: "BGP", version: "4" },
        { type: "Protocol", index: 45, name: "DNS" },
        { type: "Protocol", index: 50, name: "IBM Informix" },
        { type: "Protocol", index: 53, name: "IMAP/IMAP STARTTLS", version: "4.1" },
      ],
    });
  });

  it("returns no rows for text that doesn't match the documented shape", () => {
    expect(parseAppeShow("not a table")).toEqual({ rows: [] });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(csmAppeShow.parse([exchange(SAMPLE_SHOW_TEXT)])).toEqual(
      parseAppeShow(SAMPLE_SHOW_TEXT),
    );
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(csmAppeShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(csmAppeShow.buildFrames({})).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_SHOW_TEXT);

    expect(parseAppeShow(stdout).rows).toHaveLength(4);
    await expectClosedTransportFailure(command);
  });
});
