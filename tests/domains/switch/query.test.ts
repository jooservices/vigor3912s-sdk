import { describe, expect, it } from "vitest";

import { switchQuery } from "../../../src/domains/switch.js";
import { parseQuery } from "../../../src/internal/parsers/switch/query.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.switch.query -- switch query (read, bare form)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = switchQuery.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("switch query");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseQuery("Extern Device status query is Enable\n")).toEqual({
      raw: "Extern Device status query is Enable",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(switchQuery, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(switchQuery.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Extern Device status query is Enable\n",
    );

    expect(switchQuery.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "Extern Device status query is Enable",
    });

    await expectClosedTransportFailure(command);
  });
});
